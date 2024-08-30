import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { sleep } from "../helper-functions";
import { networkConfig } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import { TimelockController } from "../typechain-types";

const updateMinDelay: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log(`deployer: ${deployer}`)

    const confirmations = networkConfig[network.name].longBlockConfirmations;

    const _deployer = await hre.ethers.getSigner(deployer);

    const timelockController = await get("TimelockController");
    log(`timelockController: ${timelockController.address}`)

    const newMinDelay = networkConfig[network.name].timelock?.minDelay || 60
    log(`newMinDelay: ${newMinDelay}`)

    const abi = ["function updateDelay(uint256)"];

    const iface = new hre.ethers.utils.Interface(abi);

    const data = iface.encodeFunctionData("updateDelay", [newMinDelay]);

    const timelockControllerContract = await ethers.getContractAt("TimelockController", timelockController.address);

    const currMinDelay = await timelockControllerContract.getMinDelay();
    log(`currMinDelay: ${currMinDelay}`)

    const eventName = "CallScheduled";
    const latestBlock = await hre.ethers.provider.getBlockNumber();

    log("latestBlock >> ", latestBlock)
    // Fetch events
    const events = await timelockControllerContract.queryFilter(timelockControllerContract.filters[eventName](), 0, latestBlock);

    const lastId = events.length > 0 ? events[events.length - 1].args.id : hre.ethers.constants.HashZero;
    log("lastId:", lastId)

    let tx = await (await timelockControllerContract.connect(_deployer).schedule(timelockController.address, 0, data, lastId, hre.ethers.constants.HashZero, currMinDelay)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("scheduled updateDelay(uint256) at", tx.transactionHash)
    } else {
        log("ERROR scheduling acceptOwnership()")
        return
    }

    await sleep((currMinDelay + 20) * 1000)

    tx = await (await timelockControllerContract.connect(_deployer).execute(timelockController.address, 0, data, lastId, hre.ethers.constants.HashZero)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("execute updateDelay(uint256) at", tx.transactionHash)
    }

    log("----------------------------------------------------")
}

export default updateMinDelay
updateMinDelay.tags = ["all-timelock", "update-delay"]
