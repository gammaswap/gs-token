import { task } from "hardhat/config"
import { developmentLzPeers, networkConfig, productionLzPeers } from "../helper-hardhat-config";
import { GS } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const { abi: EndpoingV2ABI } = require("@layerzerolabs/lz-evm-protocol-v2/artifacts/contracts/EndpointV2.sol/EndpointV2.json")

// run as "npx hardhat --network arbitrumSepolia lz-set-config --dest baseSepolia"
task("lz-set-config", "Set config for LZ network to dest network")
    .addOptionalParam("dest", "Destination network")
    .addOptionalParam("lastid", "Custom last Id")
    .addOptionalParam("zerolastid", "Set to > 0 to set last Id to zero hash (e.g. last transaction was cancelled)")
    .addOptionalParam("exec", "Set to > 0 to execute transaction")
    .setAction(async (taskArgs, hre) => {
        if (hre.network.name === "hardhat") {
            console.warn(
                "You are running on Hardhat network, which" +
                "gets automatically created and destroyed every time. Use the Hardhat" +
                " option '--network localhost'"
            )
        }

        const { getNamedAccounts, deployments, network } = hre
        const { get } = deployments
        const { deployer } = await getNamedAccounts()
        console.log(`deployer: ${deployer}`)

        const confirmations = networkConfig[network.name].longBlockConfirmations;
        console.log("confirmations:",confirmations)

        const _deployer = await hre.ethers.getSigner(deployer);

        const timelockController = await get("TimelockController");
        console.log(`timelockController: ${timelockController.address}`)

        const gs = await get("GS");
        console.log(`gs: ${gs.address}`)

        const gsContract = (await hre.ethers.getContractAt('GS', gs.address)) as unknown as GS;

        const oappAddress = gs.address; // Replace with your OApp address
        const sendLibAddress = networkConfig[network.name].lzSendLib; // Replace with your send message library address
        const receiveLibAddress = networkConfig[network.name].lzReceiveLib; // Replace with your send message library address
        const executorAddress = networkConfig[network.name].lzExecutor;

        console.log(`oappAddress: ${oappAddress}`)
        console.log(`sendLibAddress: ${sendLibAddress}`)
        console.log(`receiveLibAddress: ${receiveLibAddress}`)
        console.log(`executorAddress: ${executorAddress}`)

        if(!validateAddress(sendLibAddress, hre, `Invalid sendLibAddress: ${sendLibAddress}`)) return;
        if(!validateAddress(receiveLibAddress, hre, `Invalid receiveLibAddress: ${receiveLibAddress}`)) return;
        if(!validateAddress(executorAddress, hre, `Invalid executorAddress: ${executorAddress}`)) return;

        const endpointAddress = await gsContract.endpoint();
        console.log(`endpointAddress: ${endpointAddress}`)

        // ABI and Contract
        const endpointContract = new hre.ethers.Contract(endpointAddress, EndpoingV2ABI, _deployer);

        const executorConfig = {
            maxMessageSize: 10000, // Example value, replace with actual
            executorAddress: executorAddress, // Replace with the actual executor address
        };

        // Encode ExecutorConfig using defaultAbiCoder
        const configTypeExecutorStruct = 'tuple(uint32 maxMessageSize, address executorAddress)';
        const encodedExecutorConfig = hre.ethers.utils.defaultAbiCoder.encode(
            [configTypeExecutorStruct],
            [executorConfig],
        );

        // Encode UlnConfig using defaultAbiCoder
        const configTypeUlnStruct =
            'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)';

        const lzPeers = isMainnet(hre) ? productionLzPeers : developmentLzPeers

        const payloads = []
        const targets = []
        const values = []
        for(let i = 0; i < lzPeers.length; i++) {
            const peerNetwork = lzPeers[i]
            const setNetwork = taskArgs.dest == peerNetwork || (!taskArgs.dest && network.name != peerNetwork)
            if (setNetwork) {
                const peerCfg = networkConfig[peerNetwork]
                const destEid = Number(peerCfg.lzEid || "0");
                if(destEid == 0) continue;

                const isPeerSupported = await endpointContract.isSupportedEid(destEid)

                if(!isPeerSupported) {
                    console.log("Peer",peerNetwork,"with eid",destEid,"is not supported")
                    continue
                }

                const sendCfg = networkConfig[network.name].lzSendULNConfig
                if(sendCfg && sendCfg[peerNetwork]) {
                    const ulnConfig = getUlnConfig(sendCfg[peerNetwork])

                    if(!validateUlnConfig(ulnConfig, hre, `lzSendULNConfigError[${peerNetwork}]`)) return;

                    console.log("==================Send Config Params Start==============================")
                    console.log("destEid:", destEid, "-", peerNetwork)
                    console.log("lzSendULN.confirmation:", ulnConfig.confirmations)
                    console.log("lzSendULN.requiredDVNCount:", ulnConfig.requiredDVNCount)
                    console.log("lzSendULN.requiredDVNs:", ulnConfig.requiredDVNs)

                    const encodedUlnConfig = hre.ethers.utils.defaultAbiCoder.encode([configTypeUlnStruct], [ulnConfig]);

                    // Define the SetConfigParam structs
                    const setConfigParamUln = {
                        eid: destEid,
                        configType: 2, // ULN_CONFIG_TYPE
                        config: encodedUlnConfig,
                    };

                    const setConfigParamExecutor = {
                        eid: destEid,
                        configType: 1, // EXECUTOR_CONFIG_TYPE
                        config: encodedExecutorConfig,
                    };

                    const data = endpointContract.interface.encodeFunctionData('setConfig',
                        [oappAddress, sendLibAddress, [setConfigParamUln, setConfigParamExecutor]]);
                    payloads.push(data)
                    targets.push(endpointAddress)
                    values.push(0)

                    console.log("==================Send Config Params End==============================")
                }

                const receiveCfg = networkConfig[network.name].lzReceiveULNConfig
                if(receiveCfg && receiveCfg[peerNetwork]) {
                    const ulnConfig = getUlnConfig(receiveCfg[peerNetwork])

                    if(!validateUlnConfig(ulnConfig, hre, `lzReceiveULNConfigError[${peerNetwork}]`)) return;

                    console.log("==================Receive Config Params Start==============================")
                    console.log("destEid:", destEid, "-", peerNetwork)
                    console.log("lzReceiveULN.confirmation:", ulnConfig.confirmations)
                    console.log("lzReceiveULN.requiredDVNCount:", ulnConfig.requiredDVNCount)
                    console.log("lzReceiveULN.requiredDVNs:", ulnConfig.requiredDVNs)

                    const encodedUlnConfig = hre.ethers.utils.defaultAbiCoder.encode([configTypeUlnStruct], [ulnConfig]);

                    // Define the SetConfigParam structs
                    const setConfigParamUln = {
                        eid: destEid,
                        configType: 2, // ULN_CONFIG_TYPE
                        config: encodedUlnConfig,
                    };

                    const data = endpointContract.interface.encodeFunctionData('setConfig',
                        [oappAddress, receiveLibAddress, [setConfigParamUln]]);
                    payloads.push(data)
                    targets.push(endpointAddress)
                    values.push(0)
                    console.log("==================Receive Config Params End==============================")
                }
            }
        }

        if(payloads.length == 0) {
            console.log("No configurations to set")
            return
        }

        const timelockControllerContract = await hre.ethers.getContractAt("TimelockController", timelockController.address);

        const currMinDelay = await timelockControllerContract.getMinDelay();
        console.log(`currMinDelay: ${currMinDelay}`)

        const eventName = "CallScheduled";
        const latestBlock = await hre.ethers.provider.getBlockNumber();
        console.log("latestBlock:", latestBlock)

        let lastId = taskArgs.lastid

        if(taskArgs.zerolastid) {
            lastId = hre.ethers.constants.HashZero
        } else if(!lastId) {
            // Fetch events
            const events = await timelockControllerContract.queryFilter(timelockControllerContract.filters[eventName](), 0, latestBlock);
            lastId = events.length > 0 ? events[events.length - 1].args.id : hre.ethers.constants.HashZero;
        }

        console.log("lastId:", lastId)

        console.log("==================scheduleBatch parameters==================")
        console.log("payloads:", payloads)
        console.log("targets :", targets)
        console.log("values  :", values)
        console.log("lastId  :", lastId)
        console.log("============================================================")
        if(taskArgs.exec) {
            console.log("execute")
            let tx = await (await timelockControllerContract.connect(_deployer).scheduleBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero, currMinDelay)).wait(confirmations);
            if(tx && tx.transactionHash) {
                console.log("scheduled batch setConfig() at", tx.transactionHash)
            } else {
                console.log("ERROR scheduling batch setConfig()")
                return
            }

            const waitSeconds = Number(currMinDelay) + 20
            console.log("waitSeconds:",waitSeconds)
            await sleep(waitSeconds * 1000)

            tx = await (await timelockControllerContract.connect(_deployer).executeBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero)).wait(confirmations);
            if(tx && tx.transactionHash) {
                console.log("execute batch setConfig() at", tx.transactionHash)
            }
            console.log("----------------------------------------------------")
        }
    }
);

function getUlnConfig(config: any) : any {
    return {
        confirmations: config.confirmations, // Example value, replace with actual
        requiredDVNCount: config.requiredDVNCount, // Example value, replace with actual
        optionalDVNCount: config?.optionalDVNCount || 0, // Example value, replace with actual
        optionalDVNThreshold: config?.optionalDVNThreshold || 0, // Example value, replace with actual
        requiredDVNs: config.requiredDVNs, // Replace with actual addresses, must be in alphabetical order
        optionalDVNs: config?.optionalDVNs || [], // Replace with actual addresses, must be in alphabetical order
    };
}

function validateUlnConfig(ulnConfig: any, hre: HardhatRuntimeEnvironment, errorName: string) : boolean {
    if(!errorName || errorName.length == 0) {
        errorName = "ConfigError"
    }
    let isValid = true;
    if(ulnConfig.confirmations <= 0) {
        console.log(`${errorName}: Invalid confirmations`, ulnConfig.confirmations)
        isValid = false
    }
    if(ulnConfig.requiredDVNCount <= 0) {
        console.log(`${errorName}: Invalid requiredDVNCount`, ulnConfig.requiredDVNCount)
        isValid = false
    }
    if(!validateAddresses(ulnConfig.requiredDVNs, false, hre)) {
        console.log(`${errorName}: Invalid requiredDVNs`, ulnConfig.requiredDVNs)
        isValid = false
    }
    if(!validateAddresses(ulnConfig.optionalDVNs, true, hre)) {
        console.log(`${errorName}: Invalid optionalDVNs `, ulnConfig.optionalDVNs)
        isValid = false
    }
    return isValid;
}

function validateAddresses(addressList: string[], allowEmptyList: boolean, hre: HardhatRuntimeEnvironment) : boolean {
    if(!allowEmptyList) {
        if(!addressList || addressList.length == 0) {
            return false;
        }
    }

    for(let i = 0; i < addressList.length; i++) {
        if(!validateAddress(addressList[i], hre, "")) {
            return false;
        }
    }

    return true;
}

function validateAddress(address: string, hre: HardhatRuntimeEnvironment, errorMsg: string) : boolean {
    if(!hre.ethers.utils.isAddress(address) || address == hre.ethers.constants.AddressZero) {
        if(!errorMsg || errorMsg.length == 0) {
            errorMsg = `Invalid address: ${address}`
        }
        console.log(errorMsg)
        return false
    }
    return true
}

function isMainnet(hre: HardhatRuntimeEnvironment) : boolean {
    return hre.network.name === "arbitrum" || hre.network.name == "mainnet" || hre.network.name == "base" || hre.network.name == "sonic";
}

function sleep(ms: number) : Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}