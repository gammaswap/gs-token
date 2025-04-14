import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isMainnet, sleep } from "../helper-functions";
import { developmentLzPeers, networkConfig, productionLzPeers } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import { TimelockController, GS } from "../typechain-types";

const updateEnforcedOptions: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log(`deployer: ${deployer}`)

    const confirmations = networkConfig[network.name].longBlockConfirmations;

    const _deployer = await hre.ethers.getSigner(deployer);

    const timelockController = await get("TimelockController");
    log(`timelockController: ${timelockController.address}`)

    const gs = await get("GS");
    log(`gs: ${gs.address}`)

    const gsContract = (await ethers.getContractAt('GS', gs.address)) as unknown as GS;

    const lzPeers = isMainnet(hre) ? productionLzPeers : developmentLzPeers

    const payloads = []
    const targets = []
    const values = []
    for(let i = 0; i < lzPeers.length; i++) {
        const peerNetwork = lzPeers[i]
        if (network.name != peerNetwork) {
            const cfg = networkConfig[peerNetwork]
            const lzEid = Number(cfg.lzEid || "0");
            const gsAddr = cfg.erc20Tokens?.gs || ""
            log("Setting Peer for network",peerNetwork," >> lzEid:", lzEid," gs:",gsAddr)
            if(lzEid > 0 && ethers.utils.isAddress(gsAddr)) {
                const _gsAddr = ethers.utils.zeroPad(gsAddr, 32)
                const hasPeer = await gsContract.isPeer(lzEid, _gsAddr);
                if(!hasPeer) {
                    log("set peer")
                    const _gsAddrStr = ethers.utils.hexlify(_gsAddr)
                    log("_gsAddr:",_gsAddrStr);
                    const data = gsContract.interface.encodeFunctionData('setPeer', [lzEid, _gsAddrStr]);
                    payloads.push(data)
                    targets.push(gs.address)
                    values.push(0)
                } else {
                    log("GS already has peer at", peerNetwork)
                }
            } else {
                log("Peer not set for", peerNetwork)
            }
        }
    }
    log("payloads >> ", payloads)
    log("targets >> ", targets)
    log("values >> ", values)

    if(payloads.length == 0) {
        log("Peers have already been set for all chains")
        return
    }

    const timelockControllerContract = await ethers.getContractAt("TimelockController", timelockController.address);

    const currMinDelay = await timelockControllerContract.getMinDelay();
    log(`currMinDelay: ${currMinDelay}`)

    const eventName = "CallScheduled";
    const latestBlock = await hre.ethers.provider.getBlockNumber();
    log("latestBlock:", latestBlock)

    // Fetch events
    const events = await timelockControllerContract.queryFilter(timelockControllerContract.filters[eventName](), 0, latestBlock);

    const lastId = events.length > 0 ? events[events.length - 1].args.id : hre.ethers.constants.HashZero;
    log("lastId:", lastId)

    log("==================scheduleBatch parameters==================")
    log("payloads:", payloads)
    log("targets :", targets)
    log("values  :", values)
    log("lastId  :", lastId)
    log("============================================================")
    let tx = await (await timelockControllerContract.connect(_deployer).scheduleBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero, currMinDelay)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("scheduled setPeer(lzEid,peerAddr) at", tx.transactionHash)
    } else {
        log("ERROR scheduling setPeer(lzEid,peerAddr)")
        return
    }

    const waitSeconds = Number(currMinDelay) + 20
    log("waitSeconds:",waitSeconds)
    await sleep(waitSeconds * 1000)

    tx = await (await timelockControllerContract.connect(_deployer).executeBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("execute setPeer(lzEid,peerAddr) at", tx.transactionHash)
    }

    for(let i = 0; i < lzPeers.length; i++) {
        const peerNetwork = lzPeers[i]
        if (network.name != peerNetwork) {
            const cfg = networkConfig[peerNetwork]
            const lzEid = Number(cfg.lzEid || "0");
            const gsAddr = cfg.erc20Tokens?.gs || ""
            const _gsAddr = ethers.utils.zeroPad(gsAddr, 32)
            const hasPeer = await gsContract.isPeer(lzEid, _gsAddr);
            log("Checking if Peer for network",peerNetwork," lzEid:", lzEid," gs:",gsAddr," is set?",hasPeer)
        }
    }
    log("----------------------------------------------------")
}

export default updateEnforcedOptions
updateEnforcedOptions.tags = ["all-timelock", "timelock-lz-peers"]
