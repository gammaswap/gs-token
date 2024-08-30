import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { sleep } from "../helper-functions";
import { networkConfig } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import { TimelockController } from "../typechain-types";

const deployTransferGSOwnership: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log(`deployer: ${deployer}`)

    const confirmations = networkConfig[network.name].longBlockConfirmations;

    const _deployer = await hre.ethers.getSigner(deployer);

    const gs = await get("GS");
    log(`gs: ${gs.address}`)

    const timelockController = await get("TimelockController");
    log(`timelockController: ${timelockController.address}`)

    const minDelay = networkConfig[network.name].timelock?.minDelay || 60
    log(`minDelay: ${minDelay}`)

    const gsContract = await ethers.getContractAt("GS", gs.address);

    let tx = await (await gsContract.connect(_deployer).setDelegate(timelockController.address)).wait(confirmations)
    if(tx && tx.transactionHash) {
        log("called setDelegate(address) at", tx.transactionHash)
    } else {
        log("ERROR setting delegate")
        return
    }

    tx = await (await gsContract.connect(_deployer).transferOwnership(timelockController.address)).wait(confirmations)
    if(tx && tx.transactionHash) {
        log("called transferOwnership(address) at", tx.transactionHash)
    } else {
        log("ERROR transferring ownership")
        return
    }

    const abi = ["function acceptOwnership()"];

    const iface = new hre.ethers.utils.Interface(abi);

    const data = iface.encodeFunctionData("acceptOwnership", []);

    const timelockControllerContract = await ethers.getContractAt("TimelockController", timelockController.address);

    const eventName = "CallScheduled";
    const latestBlock = await hre.ethers.provider.getBlockNumber();

    log("latestBlock >> ", latestBlock)
    // Fetch events
    const events = await timelockControllerContract.queryFilter(timelockControllerContract.filters[eventName](), 0, latestBlock);

    const lastId = events.length > 0 ? events[events.length - 1].args.id : hre.ethers.constants.HashZero;
    log("lastId:", lastId)

    tx = await (await timelockControllerContract.connect(_deployer).schedule(gs.address, 0, data, lastId, hre.ethers.constants.HashZero, minDelay)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("scheduled acceptOwnership() at", tx.transactionHash)
    } else {
        log("ERROR scheduling acceptOwnership()")
        return
    }

    await sleep((Number(minDelay) + 20) * 1000)

    tx = await (await timelockControllerContract.connect(_deployer).execute(gs.address, 0, data, lastId, hre.ethers.constants.HashZero)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("execute acceptOwnership() at", tx.transactionHash)
    }

    log("----------------------------------------------------")
}

export default deployTransferGSOwnership
deployTransferGSOwnership.tags = ["all-timelock", "transfer-ownership"]
