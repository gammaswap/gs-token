import { task } from "hardhat/config"
import { networkConfig } from "../helper-hardhat-config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SendLibBase } from "../typechain-types";
const { abi: SendUln302ABI } = require("@layerzerolabs/lz-evm-messagelib-v2/artifacts/contracts/uln/uln302/SendUln302.sol/SendUln302.json");

// run as "npx hardhat --network arbitrumSepolia lz-config --dest baseSepolia"
task("lz-config", "Checks LZ configurations from current network to destination network")
    .addParam("dest", "destination network")
    .addOptionalParam("app", "Set > 0 to print app configurations instead of endpoint configurations")
    .setAction(async (taskArgs, hre) => {
    if (hre.network.name === "hardhat") {
        console.warn(
            "You are running on Hardhat network, which" +
            "gets automatically created and destroyed every time. Use the Hardhat" +
            " option '--network localhost'"
        )
    }

    const { deployments, network } = hre
    const { get } = deployments

    // Define the smart contract address and ABI
    const ethereumLzEndpointABI = [
        'function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) external view returns (bytes memory config)',
        'function getSendLibrary(address _sender, uint32 _dstEid) external view returns (address lib)',
        'function getReceiveLibrary(address _receiver, uint32 _srcEid) external view returns (address lib, bool isDefault)',
        'function isDefaultSendLibrary(address _sender, uint32 _dstEid) external view returns (bool isDefault)',
        'function defaultSendLibrary(uint32 _dstEid) external view returns (address lib)',
        'function defaultReceiveLibrary(uint32 _srcEid) external view returns (address lib)',
    ];

    // Create a contract instance
    // Define the addresses and parameters
    let oappAddress = (await get('GS')).address
    console.log("oappAddress:",oappAddress)
    let oappContract = await hre.ethers.getContractAt("GS", oappAddress);
    const endpointAddr = await oappContract.endpoint();
    console.log("endpointAddr:",endpointAddr)
    const endpointContract = await hre.ethers.getContractAt(ethereumLzEndpointABI, endpointAddr);

    const srcCfg = networkConfig[network.name]
    if(!srcCfg) {
        console.log("Please provide network `--net` e.g. arbitrumSepolia, sepolia, etc.")
        return;
    }
    const srcEid = Number(srcCfg.lzEid || "0");
    console.log("srcEid:",srcEid)

    const dstNetwork = taskArgs.dest

    const destCfg = networkConfig[dstNetwork]
    if(!destCfg) {
        console.log("Please provide network `--net` e.g. arbitrumSepolia, sepolia, etc.")
        return;
    }

    const destEid = Number(destCfg.lzEid || "0");
    console.log("destEid:",destEid)

    const sendLibAddress = await endpointContract.getSendLibrary(oappAddress, destEid);
    const receiveLibResult = await endpointContract.getReceiveLibrary(oappAddress, destEid);
    const receiveLibAddress = receiveLibResult?.lib || "0x";
    const isDefaultSendLib = await endpointContract.isDefaultSendLibrary(oappAddress, destEid);
    console.log("sendLibAddress     :", sendLibAddress);
    console.log("isDefaultSendLib   :", isDefaultSendLib);
    console.log("receiveLibAddress  :", receiveLibAddress);
    console.log("isReceiveLibDefault:", receiveLibResult?.isDefault || false);
    console.log("=============EndpointV2 Default Libs=================");
    const defaultSendLibAddress = await endpointContract.defaultSendLibrary(destEid);
    console.log("defaultSendLibAddress   :", defaultSendLibAddress);
    const defaultReceiveLibAddress = await endpointContract.defaultReceiveLibrary(destEid);
    console.log("defaultReceiveLibAddress:", defaultReceiveLibAddress);
    console.log("=====================================================");
    const executorConfigType = 1; // 1 for executor
    const ulnConfigType = 2; // 2 for UlnConfig

    const isApp = Number(taskArgs.app || "0") > 0;
    try {
        // Fetch and decode for sendLib (both Executor and ULN Config)
        const executorConfigArray = await getConfig(isApp, endpointContract,
            oappAddress,
            sendLibAddress,
            destEid,
            executorConfigType,
            hre,
        );
        console.log('Send Library Executor Config:', executorConfigArray);

        const sendUlnConfigArray = await getConfig(isApp, endpointContract,
            oappAddress,
            sendLibAddress,
            destEid,
            ulnConfigType,
            hre
        );
        console.log('Send Library ULN Config:', sendUlnConfigArray);

        // Fetch and decode for receiveLib (only ULN Config)
        const receiveUlnConfigArray = await getConfig(isApp, endpointContract,
            oappAddress,
            receiveLibAddress,
            destEid,
            ulnConfigType,
            hre
        );
        console.log('Receive Library ULN Config:', receiveUlnConfigArray);
    } catch (error) {
        console.error('Error fetching or decoding config:', error);
    }

})

async function getConfig(useApp: boolean, endpointContract: any, oappAddress: string, libAddress: string, remoteEid: number, configType: number, hre: HardhatRuntimeEnvironment) {
    if(useApp) {
        if(configType == 1) {
            return await getExecutorConfig(oappAddress, libAddress, remoteEid, hre);
        } else if(configType == 2) {
            return await getAppConfig(oappAddress, libAddress, remoteEid, hre);
        }
        throw new Error("Unsupported configType: " + configType);
    }

    const configBytes = await endpointContract.getConfig(oappAddress, libAddress, remoteEid, configType);

    if(configType == 1) {
        const executorConfigAbi = ['tuple(uint32 maxMessageSize, address executorAddress)'];
        return hre.ethers.utils.defaultAbiCoder.decode(
            executorConfigAbi,
            configBytes,
        );
    } else if(configType == 2) {
        const ulnConfigStructType = [
            'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)',
        ];
        return hre.ethers.utils.defaultAbiCoder.decode(
            ulnConfigStructType,
            configBytes,
        );
    }
    throw new Error("Unsupported configType: " + configType);
}

async function getAppConfig(oappAddress: string, libAddress: string, remoteEid: number, hre: HardhatRuntimeEnvironment) {
    const libContract = await hre.ethers.getContractAt(SendUln302ABI, libAddress) as unknown;
    // @ts-ignore
    return await libContract.getAppUlnConfig(oappAddress, remoteEid);
}

async function getExecutorConfig(oappAddress: string, libAddress: string, remoteEid: number, hre: HardhatRuntimeEnvironment) {
    const libContract = await hre.ethers.getContractAt(SendUln302ABI, libAddress) as unknown as SendLibBase;
    return await libContract.getExecutorConfig(oappAddress, remoteEid);
}