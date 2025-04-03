import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isMainnet } from "../helper-functions"
import { ethers } from "hardhat";
import { networkConfig, developmentLzPeers, productionLzPeers } from "../helper-hardhat-config";
import { Options } from "@layerzerolabs/lz-v2-utilities";

const deploySetLZPeers: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log("deployer:", deployer)

    const confirmations = networkConfig[network.name].longBlockConfirmations;

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
                if(!hasPeer) {
                    log("set peer")
                    const tx = await (await gsContract.connect(_deployer).setPeer(lzEid, _gsAddr)).wait(confirmations);
                    if(tx && tx.transactionHash) {
                        log("GS in",network.name,"set peer for",peerNetwork,"in",tx.transactionHash)

                        const op = await gsContract.enforcedOptions(lzEid, 1)
                        log("op[",lzEid,"] before >> ", op)

                        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()
                        const enforcedOptionParams = [{
                            eid: lzEid,
                            msgType: 1, // 1: SEND, 2: SEND_AND_CALL
                            options: options
                        }];

                        const _tx = await (await gsContract.connect(_deployer).setEnforcedOptions(enforcedOptionParams)).wait(confirmations);
                        if(_tx && _tx.transactionHash) {
                            log("GS in",network.name,"set options",options,"for",peerNetwork,"in",_tx.transactionHash)
                        }
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

export default deploySetLZPeers
deploySetLZPeers.tags = ["all", "lz-peers", "all-timelock"]