import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { deployContract, sleep } from "../helper-functions";
import { networkConfig } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import { TimelockController } from "../typechain-types";

const deployTimelockController: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log(`deployer: ${deployer}`)

    const _deployer = await hre.ethers.getSigner(deployer);

    const gs = await get("GS");
    log(`gs: ${gs.address}`)

    const minDelay = networkConfig[network.name].timelock?.minDelay || 60
    log(`minDelay: ${minDelay}`)
    const proposers = [deployer, ...networkConfig[network.name].timelock?.proposers || []]
    log(`proposers: ${proposers}`)
    const executors = [deployer, ...networkConfig[network.name].timelock?.executors || []]
    log(`executors: ${executors}`)
    const admin = networkConfig[network.name].timelock?.admin || deployer
    log(`admin: ${admin}`)

    const timelockController = await deployContract(deployer, "TimelockController", [minDelay, proposers, executors, admin], hre) as TimelockController

    log("timelockController >>",timelockController.address)

    const gsContract = await ethers.getContractAt("GS", gs.address);

    let tx = await (await gsContract.connect(_deployer).transferOwnership(timelockController.address)).wait()
    if(tx && tx.transactionHash) {
        log("called transferOwnership(address) at", tx.transactionHash)
    }

    const abi = ["function acceptOwnership()"];

    const iface = new hre.ethers.utils.Interface(abi);

    const data = iface.encodeFunctionData("acceptOwnership", []);

    const timelockControllerContract = await ethers.getContractAt("TimelockController", timelockController.address);

    tx = await (await timelockControllerContract.connect(_deployer).schedule(gs.address, 0, data, hre.ethers.constants.HashZero, hre.ethers.constants.HashZero, minDelay)).wait();
    if(tx && tx.transactionHash) {
        log("scheduled acceptOwnership() at", tx.transactionHash)
    }

    await sleep(minDelay * 1000)

    tx = await (await timelockControllerContract.connect(_deployer).execute(gs.address, 0, data, hre.ethers.constants.HashZero, hre.ethers.constants.HashZero)).wait();
    if(tx && tx.transactionHash) {
        log("execute acceptOwnership() at", tx.transactionHash)
    }

    log("----------------------------------------------------")
}

export default deployTimelockController
deployTimelockController.tags = ["all", "timelock"]
