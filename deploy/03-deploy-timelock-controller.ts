import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { deployContract } from "../helper-functions";
import { networkConfig } from "../helper-hardhat-config";
import { TimelockController } from "../typechain-types";

const deployTimelockController: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log(`deployer: ${deployer}`)

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

    await deployContract(deployer, "TimelockController", [minDelay, proposers, executors, admin], hre)

    log("----------------------------------------------------")
}

export default deployTimelockController
deployTimelockController.tags = ["all-timelock", "timelock"]
