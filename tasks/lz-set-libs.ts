import { task } from "hardhat/config"
import { developmentLzPeers, networkConfig, productionLzPeers } from "../helper-hardhat-config";
import { GS } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const { abi: EndpoingV2ABI } = require("@layerzerolabs/lz-evm-protocol-v2/artifacts/contracts/EndpointV2.sol/EndpointV2.json")

// run as "npx hardhat --network arbitrumSepolia lz-set-libs --net baseSepolia --action 1 --lastid 0x12345... --exec 1"
// run as "npx hardhat --network arbitrumSepolia lz-set-libs --net baseSepolia --action 1 --zerolastid 1 --exec 1"
task("lz-set-libs", "Set sendLib and receiveLib for LZ network to src and dest network")
    .addOptionalParam("net", "Eid network")
    .addOptionalParam("lastid", "Custom last Id")
    .addOptionalParam("zerolastid", "Set to > 0 to set last Id to zero hash (e.g. last transaction was cancelled)")
    .addOptionalParam("action", "0=schedule and execute, 1=schedule only, 2=execute only, default=0")
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
            const sendLibAddress = networkConfig[network.name].lzSendLib as string; // Replace with your send message library address
            const receiveLibAddress = networkConfig[network.name].lzReceiveLib as string; // Replace with your send message library address

            console.log(`oappAddress: ${oappAddress}`)
            console.log(`sendLibAddress: ${sendLibAddress}`)
            console.log(`receiveLibAddress: ${receiveLibAddress}`)

            if(!validateAddress(sendLibAddress, hre, `Invalid sendLibAddress: ${sendLibAddress}`)) return;
            if(!validateAddress(receiveLibAddress, hre, `Invalid receiveLibAddress: ${receiveLibAddress}`)) return;

            const endpointAddress = await gsContract.endpoint();
            console.log(`endpointAddress: ${endpointAddress}`)

            // ABI and Contract
            const endpointContract = new hre.ethers.Contract(endpointAddress, EndpoingV2ABI, _deployer);

            const lzPeers = isMainnet(hre) ? productionLzPeers : developmentLzPeers

            const payloads = []
            const targets = []
            const values = []
            for(let i = 0; i < lzPeers.length; i++) {
                const peerNetwork = lzPeers[i]
                const setNetwork = taskArgs.net == peerNetwork || (!taskArgs.net && network.name != peerNetwork)
                if (setNetwork) {
                    const peerCfg = networkConfig[peerNetwork]
                    const lzEid = Number(peerCfg.lzEid || "0");
                    if(lzEid == 0) continue;

                    const isPeerSupported = await endpointContract.isSupportedEid(lzEid)

                    if(!isPeerSupported) {
                        console.log("Peer",peerNetwork,"with eid",lzEid,"is not supported")
                        continue
                    }

                    console.log("==================Send Lib Start==============================")
                    console.log("destEid:", lzEid, "-", peerNetwork, "- SendLib: ", sendLibAddress)

                    const sendData = endpointContract.interface.encodeFunctionData('setSendLibrary',
                        [oappAddress, lzEid, sendLibAddress]);
                    payloads.push(sendData)
                    targets.push(endpointAddress)
                    values.push(0)

                    console.log("==================Send Lib End==============================")

                    console.log("==================Receive Lib Start==============================")
                    console.log("srcEid:", lzEid, "-", peerNetwork, "- ReceiveLib: ", receiveLibAddress)

                    const receiveData = endpointContract.interface.encodeFunctionData('setReceiveLibrary',
                        [oappAddress, lzEid, receiveLibAddress, 0]);
                    payloads.push(receiveData)
                    targets.push(endpointAddress)
                    values.push(0)
                    console.log("==================Receive Lib End==============================")
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
            console.log("salt    :", hre.ethers.constants.HashZero)
            console.log("============================================================")
            const action = Number(taskArgs.action || "0")
            console.log("action:", action == 0 ? "schedule and execute" : action == 1 ? "schedule only" : "execute only")
            if(taskArgs.exec) {
                console.log("execute")
                if(action == 0 || action == 1) {
                    const scheduleTx = await (await timelockControllerContract.connect(_deployer).scheduleBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero, currMinDelay)).wait(confirmations);
                    if(scheduleTx && scheduleTx.transactionHash) {
                        console.log("scheduled batch setConfig() at", scheduleTx.transactionHash)
                    } else {
                        console.log("ERROR scheduling batch setConfig()")
                        return
                    }
                }

                if(action == 0) {
                    const waitSeconds = Number(currMinDelay) + 20
                    console.log("waitSeconds:",waitSeconds)
                    await sleep(waitSeconds * 1000)
                }

                if(action == 0 || action == 2) {
                    const executeTx = await (await timelockControllerContract.connect(_deployer).executeBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero)).wait(confirmations);
                    if(executeTx && executeTx.transactionHash) {
                        console.log("execute batch setConfig() at", executeTx.transactionHash)
                    }
                }
                console.log("----------------------------------------------------")
            }
        }
    );

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