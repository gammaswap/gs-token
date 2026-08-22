import { task } from "hardhat/config"
import { networkConfig } from "../helper-hardhat-config";
import { TimelockController } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// run as "npx hardhat --network arbitrumSepolia timelock --action 1"
// run as "npx hardhat --network arbitrumSepolia timelock --action 2 --txid 0x12456789.."
task("timelock", "Cancel scheduled transactions or list scheduled transactions")
    .addOptionalParam("action", "1=list, 2=cancel")
    .addOptionalParam("txid", "txid to cancel when action=2")
    .addOptionalParam("exec", "if set to > 0 then execute")
    .addOptionalParam("from", "address to execute from")
    .addOptionalParam("v", "if set to any value, print available addresses")
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
        const namedAccounts = await getNamedAccounts()
        if(!!taskArgs.v) {
            console.log("namedAccounts >> ", namedAccounts)
        }

        let _deployer;
        if(taskArgs.from) {
            if(!namedAccounts[taskArgs.from]) {
                console.log("Error: namedAccount not found: ", taskArgs.from);
                return;
            }
            _deployer = await hre.ethers.getSigner(namedAccounts[taskArgs.from]);
        } else {
            _deployer = await hre.ethers.getSigner(namedAccounts["deployer"]);
        }
        console.log("_deployer >>", _deployer?.address)

        const confirmations = networkConfig[network.name].longBlockConfirmations;
        console.log("confirmations:",confirmations)

        const timelockController = await get("TimelockController");
        console.log(`timelockController: ${timelockController.address}`)

        const timelockControllerContract = (await hre.ethers.getContractAt('TimelockController', timelockController.address)) as unknown as TimelockController;

        const action = parseInt(taskArgs.action || 0)

        const eventName = "CallScheduled";
        const latestBlock = await hre.ethers.provider.getBlockNumber();

        console.log("latestBlock >> ", latestBlock)
        // Fetch events
        const logs = await timelockControllerContract.queryFilter(timelockControllerContract.filters[eventName](), 0, latestBlock);

        if(action == 1) {
            if(logs.length == 0) {
                console.log("no events");
                return;
            }
            for(let i = logs.length - 1; i >= 0; i--) {
                const parsed = timelockControllerContract.interface.parseLog(logs[i]);
                // @ts-ignore
                console.log(`id[${i}]:`, parsed.args.id ?? parsed.args[0]);
            }
            return
        }

        const exec = parseInt(taskArgs.exec || 0)

        if(action == 2) {
            const txId = taskArgs.txid;
            if(exec > 0) {
                if(txId && hre.ethers.utils.isHexString(txId) && hre.ethers.constants.HashZero != txId) {
                    const tx = await (await timelockControllerContract.connect(_deployer).cancel(txId)).wait();
                    if(tx && tx?.transactionHash) {
                        console.log("tx.hash >> ", tx.transactionHash);
                    }
                } else {
                    console.log("missing or invalid txId to cancel");
                }
            }
            return;
        }
        console.log("----------------------------------------------------")
    }
);
