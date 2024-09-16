import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isMainnet, sleep } from "../helper-functions";
import { developmentLzPeers, networkConfig, productionLzPeers } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import { TimelockController, GS } from "../typechain-types";
import { Options } from "@layerzerolabs/lz-v2-utilities";

const updateEnforcedOptions: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log(`deployer: ${deployer}`)

    const confirmations = networkConfig[network.name].longBlockConfirmations;

    const _deployer = await hre.ethers.getSigner(deployer);

    const timelockController = await get("TimelockController");
    log(`timelockController: ${timelockController.address}`)

    const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

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
            const op = await gsContract.enforcedOptions(lzEid, 1)
            log("op[",lzEid,"] before >> ", op)

            const enforcedOptionParams = [{
                eid: lzEid,
                msgType: 1, // 1: SEND, 2: SEND_AND_CALL
                options: options
            }];

            const data = gsContract.interface.encodeFunctionData('setEnforcedOptions', [enforcedOptionParams]);
            log("data >>", data)
            payloads.push(data)
            targets.push(gs.address)
            values.push(0)
        }
    }
    log("payloads >> ", payloads)
    log("targets >> ", targets)
    log("values >> ", values)

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

    let tx = await (await timelockControllerContract.connect(_deployer).scheduleBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero, currMinDelay)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("scheduled setEnforcedOptions(struct) at", tx.transactionHash)
    } else {
        log("ERROR scheduling setEnforcedOptions(struct)")
        return
    }

    const waitSeconds = Number(currMinDelay) + 20
    log("waitSeconds:",waitSeconds)
    await sleep(waitSeconds * 1000)

    tx = await (await timelockControllerContract.connect(_deployer).executeBatch(targets, values, payloads, lastId, hre.ethers.constants.HashZero)).wait(confirmations);
    if(tx && tx.transactionHash) {
        log("execute updateDelay(uint256) at", tx.transactionHash)
    }

    for(let i = 0; i < lzPeers.length; i++) {
        const peerNetwork = lzPeers[i]
        if (network.name != peerNetwork) {
            const cfg = networkConfig[peerNetwork]
            const lzEid = Number(cfg.lzEid || "0");
            const op = await gsContract.enforcedOptions(lzEid, 1)
            log("op[", lzEid, " after >> ", op)
        }
    }
    log("----------------------------------------------------")
}

export default updateEnforcedOptions
updateEnforcedOptions.tags = ["all-timelock", "update-enforced-options"]
