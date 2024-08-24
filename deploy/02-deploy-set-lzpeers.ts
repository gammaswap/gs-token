import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isMainnet } from "../helper-functions"
import { ethers } from "hardhat";
import { networkConfig, developmentLzPeers, productionLzPeers } from "../helper-hardhat-config";

const deployGSToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log("deployer:", deployer)

    const _deployer = await hre.ethers.getSigner(deployer);

    const gs = await get("GS");
    log("gs:", gs.address)

    const gsContract = await ethers.getContractAt("GS", gs.address);

    const lzPeers = isMainnet(hre) ? productionLzPeers : developmentLzPeers

    for(let i = 0; i < lzPeers.length; i++) {
        const peerNetwork = lzPeers[i]
        if(network.name != peerNetwork) {
            const cfg = networkConfig[peerNetwork]
            const lzEid = Number(cfg.lzEid || "0");
            const gsAddr = cfg.erc20Tokens?.gs || ""
            log("Setting Peer for network",peerNetwork," >> lzEid:", lzEid," gs:",gsAddr)
            if(lzEid > 0 && ethers.utils.isAddress(gsAddr)) {
                const _gsAddr = ethers.utils.zeroPad(gsAddr, 32)
                const hasPeer = await gsContract.isPeer(lzEid, _gsAddr);
                if(hasPeer) {
                    const tx = await (await gsContract.connect(_deployer).setPeer(lzEid, _gsAddr)).wait();
                    if(tx && tx.transactionHash) {
                        log("GS in",network.name,"set peer for",peerNetwork,"for",tx.transactionHash)
                    }
                } else {
                    log("GS already has peer at",peerNetwork)
                }
            } else {
                log("Peer not set for",peerNetwork)
            }
        }
    }
}

export default deployGSToken
deployGSToken.tags = ["all", "lz-peers"]