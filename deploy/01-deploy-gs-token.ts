import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { deployContract, deployContractByArtifact } from "../helper-functions"
import { ethers } from "hardhat";
import { networkConfig } from "../helper-hardhat-config";

const deployGSToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { log } = deployments
    const { deployer } = await getNamedAccounts()
    log("deployer ", deployer)

    const _deployer = await hre.ethers.getSigner(deployer);
    log("deployer:",deployer)

    const ONE = ethers.BigNumber.from(10).pow(18);

    let lzEndpoint = networkConfig[network.name].lzEndpoint
    if(network.name == "hardhat") {
        const lzEndPointMock = await deployContract(deployer, "EndpointV2Mock", [1], hre)
        lzEndpoint = lzEndPointMock.address
        log(`Wrapped Ether deployed at ${lzEndpoint}`)
    }

    if(!ethers.utils.isAddress(lzEndpoint)) {
        console.log("ERROR: LZEndpoint for",network.name,"is not an address:", lzEndpoint)
        return
    }

    const initialAmount = ethers.BigNumber.from(networkConfig[network.name].initialGSTokenAmt || "0").mul(ONE)
    console.log("initialAmount:", initialAmount.toString());

    const gsImpl = await deployContractByArtifact(deployer, "GSImpl",
        "GS", [lzEndpoint, deployer, ethers.constants.Zero], hre);

    const gs = await deployContractByArtifact(deployer, "GS","ERC1967Proxy",
        [gsImpl.address,"0x"], hre);

    const gsContract = await ethers.getContractAt("GS", gs.address);

    const tx = await (await gsContract.connect(_deployer).initialize(deployer, initialAmount)).wait();
    if(tx && tx.transactionHash) {
        console.log("GS initialized at", tx.transactionHash)
    }
    log("GS proxy deployed to:", gsContract.address);
}

export default deployGSToken
deployGSToken.tags = ["all", "gs-token"]