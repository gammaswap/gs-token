import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import {deployContract, deployContractByArtifact} from "../helper-functions"
import { ethers } from "hardhat";
import { networkConfig } from "../helper-hardhat-config";

const upgradeGSImplContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const confirmations = networkConfig[network.name].longBlockConfirmations;

    const _deployer = await hre.ethers.getSigner(deployer);
    log("deployer:", _deployer.address);

    let lzEndpoint = networkConfig[network.name].lzEndpoint
    if(network.name == "hardhat") {
        const lzEndPointMock = await deployContract(deployer, "EndpointV2Mock", [1], hre)
        lzEndpoint = lzEndPointMock.address
        log(`Wrapped Ether deployed at ${lzEndpoint}`)
    }
    log("lzEndpoint:", lzEndpoint)

    if(!ethers.utils.isAddress(lzEndpoint)) {
        log("ERROR: LZEndpoint for",network.name,"is not an address:", lzEndpoint)
        return
    }

    const gsObj = await get("GS")
    log("gsObj     >> ", gsObj.address);
    const gsImplObj = await get("GSImpl")
    log("gsImplObj >> ", gsImplObj.address);
    const gsImpl = await deployContractByArtifact(deployer, "GSImpl", "GS", [lzEndpoint, deployer, ethers.constants.Zero], hre);
    const gsContract = await ethers.getContractAt('GS', gsObj.address, _deployer);

    if(gsImpl.address != gsImplObj.address) {
        log("upgrade GS implementation to", gsImpl.address)
        const tx = await (await gsContract.connect(_deployer).upgradeTo(gsImpl.address)).wait(confirmations);
        if(tx&&tx.transactionHash) {
            log("tx >> ", tx.transactionHash);
            log("implementation upgrade successful")
        }
    } else {
        log("GS implementation not upgraded")
    }
    log("----------------------------------------------------")
}

export default upgradeGSImplContract
upgradeGSImplContract.tags = ["all", "upd-gs-token"]