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
    log("deployer:", deployer)

    const confirmations = networkConfig[network.name].longBlockConfirmations;

    const _deployer = await hre.ethers.getSigner(deployer);

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

    const ONE = ethers.BigNumber.from(10).pow(18);
    const initialAmount = ethers.BigNumber.from(networkConfig[network.name].initialGSTokenAmt || "0").mul(ONE)
    log("initialAmount:", initialAmount.toString());

    const mintGSTokenTo = networkConfig[network.name].mintGSTokenTo || _deployer.address
    if(!ethers.utils.isAddress(mintGSTokenTo)) {
        log("ERROR: mintGSTokenTo is not an address:", mintGSTokenTo)
        return
    }
    log("mintGSTokenTo:", mintGSTokenTo.toString());

    const gsImpl = await deployContractByArtifact(deployer, "GSImpl", "GS", [lzEndpoint, deployer, ethers.constants.Zero], hre);

    const gs = await deployContractByArtifact(deployer, "GS","ERC1967Proxy", [gsImpl.address,"0x"], hre);

    const gsContract = await ethers.getContractAt("GS", gs.address);

    const tx = await (await gsContract.connect(_deployer).initialize(deployer, mintGSTokenTo, initialAmount)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("GS initialized at", tx.transactionHash)
    }
    log("GS proxy deployed to:", gsContract.address);
}

export default deployGSToken
deployGSToken.tags = ["all", "gs-token", "all-timelock"]