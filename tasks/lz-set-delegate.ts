import { task } from "hardhat/config"
import { networkConfig } from "../helper-hardhat-config";
import { GS, TimelockController } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// run as "npx hardhat --network arbitrumSepolia lz-set-delegate --addr 0x1234... --lastid 0x12456789.."
task("lz-set-delegate", "Set delegate for GS token's endpoint")
    .addOptionalParam("addr", "Custom address of delegate, if not set user timelockcontroller")
    .addOptionalParam("action", "0=schedule and execute, 1=schedule only, 2=execute only, default=0")
    .addOptionalParam("zerolastid", "Set to > 0 to set last Id to zero hash (e.g. last transaction was cancelled)")
    .addOptionalParam("lastid", "Custom last Id in case last transaction was cancelled")
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

        const delegateAddress = taskArgs.addr || timelockController.address
        if(!validateAddress(delegateAddress, hre, `Invalid delegateAddress: ${delegateAddress}`)) return;
        console.log(`delegateAddress: ${delegateAddress}`)

        const gs = await get("GS");
        console.log(`gs: ${gs.address}`)

        const gsContract = (await hre.ethers.getContractAt('GS', gs.address)) as unknown as GS;

        const endpointAddress = await gsContract.endpoint();
        console.log(`endpointAddress: ${endpointAddress}`)

        const payloads = []
        const targets = []
        const values = []

        const data = gsContract.interface.encodeFunctionData('setDelegate',
            [timelockController.address]);
        payloads.push(data)
        targets.push(gsContract.address)
        values.push(0)

        if(payloads.length == 0) {
            console.log("No configurations to set")
            return
        }

        const timelockControllerContract = (await hre.ethers.getContractAt('TimelockController', timelockController.address)) as unknown as TimelockController;

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
        const action = Number(taskArgs.action || "0")
        console.log("action:", action == 0 ? "schedule and execute" : action == 1 ? "schedule only" : "execute only")
        if(taskArgs.exec) {
            if (action == 0 || action == 1) {
                console.log("exec schedule")
                let tx = await (await timelockControllerContract.connect(_deployer).scheduleBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero, currMinDelay)).wait(confirmations);
                if (tx && tx.transactionHash) {
                    console.log("scheduled batch setDelegate() at", tx.transactionHash)
                } else {
                    console.log("ERROR scheduling batch setDelegate()")
                    return
                }
            }
            if (action == 0) {
                const waitSeconds = Number(currMinDelay) + 20
                console.log("waitSeconds:", waitSeconds)
                await sleep(waitSeconds * 1000)
            }

            if (action == 0 || action == 2) {
                console.log("exec execution")
                let tx = await (await timelockControllerContract.connect(_deployer).executeBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero)).wait(confirmations);
                if (tx && tx.transactionHash) {
                    console.log("execute batch setDelegate() at", tx.transactionHash)
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

function sleep(ms: number) : Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}