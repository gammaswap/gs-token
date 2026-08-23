import { task } from "hardhat/config";
import { developmentLzPeers, networkConfig, productionLzPeers } from "../helper-hardhat-config";
import { GS } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const { abi: EndpointV2ABI } = require("@layerzerolabs/lz-evm-protocol-v2/artifacts/contracts/EndpointV2.sol/EndpointV2.json");

// LayerZero libraries and configs must be set in helper-hardhat-config.ts.
//
// Schedule one route:
//   npx hardhat --network arbitrumSepolia lz-set-libs-and-config --dest baseSepolia --action 1 --exec 1
//
// Execute one previously scheduled route:
//   npx hardhat --network arbitrumSepolia lz-set-libs-and-config --dest baseSepolia --action 2 --lastid 0xPREDECESSOR_ID --exec 1
//
// Schedule all configured routes:
//   npx hardhat --network arbitrumSepolia lz-set-libs-and-config --action 1 --exec 1
//
// Execute all previously scheduled routes:
//   npx hardhat --network arbitrumSepolia lz-set-libs-and-config --action 2 --lastid 0xPREDECESSOR_ID --exec 1
//
// If the predecessor operation was cancelled, use HashZero for both commands:
//   npx hardhat --network arbitrumSepolia lz-set-libs-and-config --action 1 --zerolastid 1 --exec 1
//   npx hardhat --network arbitrumSepolia lz-set-libs-and-config --action 2 --zerolastid 1 --exec 1
//
// action:
//   0 = schedule and execute
//   1 = schedule only
//   2 = execute only
//
// --exec must be supplied for transactions to be submitted.
task("lz-set-libs-and-config", "Set LayerZero libraries and configs through the timelock")
    .addOptionalParam("dest", "Destination network; omit to configure all configured peers")
    .addOptionalParam("action", "0=schedule and execute, 1=schedule only, 2=execute only, default=0")
    .addOptionalParam("lastid", "Timelock predecessor operation ID")
    .addOptionalParam("zerolastid", "Use HashZero as the predecessor, for example after cancellation")
    .addOptionalParam("exec", "Set to > 0 to submit transactions")
    .setAction(async (taskArgs, hre) => {
        if (hre.network.name === "hardhat") {
            console.warn(
                "You are running on Hardhat network, which gets automatically " +
                "created and destroyed every time. Use the Hardhat option " +
                "'--network localhost'"
            );
        }

        const { getNamedAccounts, deployments, network } = hre;
        const { get } = deployments;
        const { deployer } = await getNamedAccounts();

        console.log(`deployer: ${deployer}`);

        const cfg = networkConfig[network.name];
        if (!cfg) {
            console.log(`No network configuration found for ${network.name}`);
            return;
        }

        const confirmations = cfg.longBlockConfirmations || 1;
        const deployerSigner = await hre.ethers.getSigner(deployer);

        const timelock = await get("TimelockController");
        const gs = await get("GS");

        console.log(`timelockController: ${timelock.address}`);
        console.log(`gs: ${gs.address}`);

        const action = Number(taskArgs.action || "0");
        if (![0, 1, 2].includes(action)) {
            console.log("action must be 0, 1, or 2");
            return;
        }

        const gsContract = (await hre.ethers.getContractAt("GS", gs.address)) as unknown as GS;

        const oappAddress = gs.address;
        const endpointAddress = await gsContract.endpoint();
        const sendLibAddress = cfg.lzSendLib;
        const receiveLibAddress = cfg.lzReceiveLib;
        const executorAddress = cfg.lzExecutor;

        console.log(`oappAddress: ${oappAddress}`);
        console.log(`endpointAddress: ${endpointAddress}`);
        console.log(`sendLibAddress: ${sendLibAddress}`);
        console.log(`receiveLibAddress: ${receiveLibAddress}`);
        console.log(`executorAddress: ${executorAddress}`);

        if (!validateAddress(sendLibAddress, hre, `Invalid send library: ${sendLibAddress}`)) return;
        if (!validateAddress(receiveLibAddress, hre, `Invalid receive library: ${receiveLibAddress}`)) return;
        if (!validateAddress(executorAddress, hre, `Invalid executor: ${executorAddress}`)) return;

        const endpointContract = new hre.ethers.Contract(endpointAddress, EndpointV2ABI, deployerSigner);

        const peers = isMainnet(hre) ? productionLzPeers : developmentLzPeers;

        const selectedPeers = peers.filter((peerNetwork) => {
            if (taskArgs.dest) {
                return taskArgs.dest === peerNetwork;
            }

            return network.name !== peerNetwork;
        });

        if (selectedPeers.length === 0) {
            console.log("No peer routes selected");
            return;
        }

        const targets: string[] = [];
        const values: number[] = [];
        const payloads: string[] = [];

        // Phase 1: update all send and receive libraries first.
        for (const peerNetwork of selectedPeers) {
            const peerCfg = networkConfig[peerNetwork];
            if (!peerCfg) {
                console.log(`Missing network configuration for ${peerNetwork}`);
                continue;
            }

            const peerEid = Number(peerCfg.lzEid || "0");
            if (peerEid === 0) {
                console.log(`Skipping ${peerNetwork}: missing LayerZero EID`);
                continue;
            }

            const isPeerSupported = await endpointContract.isSupportedEid(peerEid);
            if (!isPeerSupported) {
                console.log(
                    `Skipping ${peerNetwork}: endpoint does not support EID ${peerEid}`
                );
                continue;
            }

            console.log(`Adding library updates for ${peerNetwork} (EID ${peerEid})`);

            const sendLibraryData = endpointContract.interface.encodeFunctionData(
                "setSendLibrary",
                [oappAddress, peerEid, sendLibAddress]
            );
            targets.push(endpointAddress);
            values.push(0);
            payloads.push(sendLibraryData);

            const receiveLibraryData = endpointContract.interface.encodeFunctionData(
                "setReceiveLibrary",
                [oappAddress, peerEid, receiveLibAddress, 0]
            );
            targets.push(endpointAddress);
            values.push(0);
            payloads.push(receiveLibraryData);
        }

        const executorConfig = {
            maxMessageSize: 10000,
            executorAddress,
        };
        const executorConfigType =
            "tuple(uint32 maxMessageSize, address executorAddress)";
        const encodedExecutorConfig = hre.ethers.utils.defaultAbiCoder.encode(
            [executorConfigType],
            [executorConfig]
        );
        const ulnConfigType =
            "tuple(uint64 confirmations,uint8 requiredDVNCount,uint8 optionalDVNCount,uint8 optionalDVNThreshold,address[] requiredDVNs,address[] optionalDVNs)";

        // Phase 2: add all send and receive configs after the library calls.
        for (const peerNetwork of selectedPeers) {
            const peerCfg = networkConfig[peerNetwork];
            if (!peerCfg) continue;

            const peerEid = Number(peerCfg.lzEid || "0");
            if (peerEid === 0) continue;

            const isPeerSupported = await endpointContract.isSupportedEid(peerEid);
            if (!isPeerSupported) {
                console.log("Peer",peerNetwork,"with eid",peerEid,"is not supported")
                continue;
            }

            const sendCfg = cfg.lzSendULNConfig?.[peerNetwork];
            if (sendCfg) {
                const sendUlnConfig = getUlnConfig(sendCfg);
                if (!validateUlnConfig(sendUlnConfig, hre, `Invalid send config for ${peerNetwork}`)) return;

                console.log("==================Send Config Params Start==============================")
                console.log("destEid:", peerEid, "-", peerNetwork)
                console.log("lzSendULN.confirmation:", sendUlnConfig.confirmations)
                console.log("lzSendULN.requiredDVNCount:", sendUlnConfig.requiredDVNCount)
                console.log("lzSendULN.requiredDVNs:", sendUlnConfig.requiredDVNs)

                const encodedUlnConfig = hre.ethers.utils.defaultAbiCoder.encode(
                    [ulnConfigType],
                    [sendUlnConfig]
                );

                const sendConfigData = endpointContract.interface.encodeFunctionData(
                    "setConfig",
                    [
                        oappAddress,
                        sendLibAddress,
                        [
                            {
                                eid: peerEid,
                                configType: 2,
                                config: encodedUlnConfig,
                            },
                            {
                                eid: peerEid,
                                configType: 1,
                                config: encodedExecutorConfig,
                            },
                        ],
                    ]
                );

                targets.push(endpointAddress);
                values.push(0);
                payloads.push(sendConfigData);
                console.log("==================Send Config Params End==============================")
            }

            const receiveCfg = cfg.lzReceiveULNConfig?.[peerNetwork];
            if (receiveCfg) {
                const receiveUlnConfig = getUlnConfig(receiveCfg);
                if (!validateUlnConfig(receiveUlnConfig, hre, `Invalid receive config for ${peerNetwork}`)) return;

                console.log("==================Receive Config Params Start==============================")
                console.log("destEid:", peerEid, "-", peerNetwork)
                console.log("lzReceiveULN.confirmation:", receiveUlnConfig.confirmations)
                console.log("lzReceiveULN.requiredDVNCount:", receiveUlnConfig.requiredDVNCount)
                console.log("lzReceiveULN.requiredDVNs:", receiveUlnConfig.requiredDVNs)

                const encodedUlnConfig = hre.ethers.utils.defaultAbiCoder.encode(
                    [ulnConfigType],
                    [receiveUlnConfig]
                );

                const receiveConfigData = endpointContract.interface.encodeFunctionData(
                    "setConfig",
                    [
                        oappAddress,
                        receiveLibAddress,
                        [
                            {
                                eid: peerEid,
                                configType: 2,
                                config: encodedUlnConfig,
                            },
                        ],
                    ]
                );

                targets.push(endpointAddress);
                values.push(0);
                payloads.push(receiveConfigData);
                console.log("==================Receive Config Params End==============================")
            }
        }

        if (payloads.length === 0) {
            console.log("No configurations to set");
            return;
        }

        const timelockContract = await hre.ethers.getContractAt("TimelockController", timelock.address);
        const currentMinDelay = await timelockContract.getMinDelay();

        const latestBlock = await hre.ethers.provider.getBlockNumber();
        console.log("latestBlock:", latestBlock);

        let predecessor = taskArgs.lastid;
        if (taskArgs.zerolastid) {
            predecessor = hre.ethers.constants.HashZero;
        } else if (!predecessor) {
            const events = await timelockContract.queryFilter(
                timelockContract.filters.CallScheduled(),
                0,
                latestBlock
            );
            predecessor = events.length > 0 ? events[events.length - 1].args.id : hre.ethers.constants.HashZero;
        }

        const salt = hre.ethers.constants.HashZero;

        console.log("lastId:", predecessor);

        console.log("==================scheduleBatch parameters==================");
        console.log("payloads:", payloads);
        console.log("targets :", targets);
        console.log("values  :", values);
        console.log("lastId  :", predecessor);
        console.log("salt    :", salt);
        console.log("delay   :", currentMinDelay);
        console.log("============================================================");

        console.log("==================transaction details==================");
        for (let i = 0; i < payloads.length; i++) {
            console.log(`transaction[${i}] target:`, targets[i]);
            console.log(`transaction[${i}] value :`, values[i]);
            console.log(`transaction[${i}] data  :`, payloads[i]);
            console.log('-------------------------------------------------------');
        }
        console.log("========================================================");
        console.log("action:", action === 0 ? "schedule and execute" : action === 1 ? "schedule only" : "execute only");

        if (!taskArgs.exec) {
            console.log("No transaction submitted. Pass --exec 1 to submit.");
            return;
        }

        if (action === 0 || action === 1) {
            console.log("exec schedule");
            const tx = await (
                await timelockContract.connect(deployerSigner).scheduleBatch(
                    targets,
                    values,
                    payloads,
                    predecessor,
                    salt,
                    currentMinDelay
                )
            ).wait(confirmations);

            console.log(`scheduled combined batch at ${tx.transactionHash}`);
        }

        if (action === 0) {
            const waitSeconds = Number(currentMinDelay) + 20;
            console.log(`Waiting ${waitSeconds} seconds before execution...`);
            await sleep(waitSeconds * 1000);
        }

        if (action === 0 || action === 2) {
            console.log("exec execute");
            const tx = await (
                await timelockContract.connect(deployerSigner).executeBatch(
                    targets,
                    values,
                    payloads,
                    predecessor,
                    salt
                )
            ).wait(confirmations);

            console.log(`executed combined batch at ${tx.transactionHash}`);
        }

        console.log("----------------------------------------------------")
    });

function getUlnConfig(config: any): any {
    return {
        confirmations: config.confirmations,
        requiredDVNCount: config.requiredDVNCount,
        optionalDVNCount: config.optionalDVNCount || 0,
        optionalDVNThreshold: config.optionalDVNThreshold || 0,
        requiredDVNs: config.requiredDVNs,
        optionalDVNs: config.optionalDVNs || [],
    };
}

function validateUlnConfig(config: any, hre: HardhatRuntimeEnvironment, errorName: string): boolean {
    if (config.confirmations <= 0) {
        console.log(`${errorName}: invalid confirmations`);
        return false;
    }

    if (config.requiredDVNCount <= 0) {
        console.log(`${errorName}: invalid requiredDVNCount`);
        return false;
    }

    if (!validateAddresses(config.requiredDVNs, false, hre)) {
        console.log(`${errorName}: invalid requiredDVNs`);
        return false;
    }

    if (!validateAddresses(config.optionalDVNs, true, hre)) {
        console.log(`${errorName}: invalid optionalDVNs`);
        return false;
    }

    return true;
}

function validateAddresses(addresses: string[], allowEmptyList: boolean, hre: HardhatRuntimeEnvironment): boolean {
    if (!allowEmptyList && addresses.length === 0) {
        return false;
    }

    for (const address of addresses) {
        if (!validateAddress(address, hre, "")) {
            return false;
        }
    }

    return true;
}

function validateAddress(address: string | undefined, hre: HardhatRuntimeEnvironment, errorMessage: string): boolean {
    if (
        !address ||
        !hre.ethers.utils.isAddress(address) ||
        address === hre.ethers.constants.AddressZero
    ) {
        console.log(errorMessage || `Invalid address: ${address}`);
        return false;
    }

    return true;
}

function isMainnet(hre: HardhatRuntimeEnvironment): boolean {
    return (
        hre.network.name === "arbitrum" ||
        hre.network.name === "mainnet" ||
        hre.network.name === "base" ||
        hre.network.name === "sonic"
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
