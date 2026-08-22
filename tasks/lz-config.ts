import { task } from "hardhat/config"
import { networkConfig } from "../helper-hardhat-config";

// run as "npx hardhat --network arbitrumSepolia lz-config --dest baseSepolia"
task("lz-config", "Checks LZ configurations from current network to destination network")
    .addParam("dest", "destination network")
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
    const receiveLibResult = (await endpointContract.getReceiveLibrary(oappAddress, destEid));
    const receiveLibAddress = receiveLibResult?.lib || "0x";
    const isDefaultSendLib = await endpointContract.isDefaultSendLibrary(oappAddress, destEid);
    console.log("sendLibAddress     :",sendLibAddress);
    console.log("isDefaultSendLib   :",isDefaultSendLib);
    console.log("receiveLibAddress  :",receiveLibAddress);
    console.log("isReceiveLibDefault:",receiveLibResult?.isDefault || false);
    console.log("=============EndpointV2 Default Libs=================");
    const defaultSendLibAddress = await endpointContract.defaultSendLibrary(destEid);
    console.log("defaultSendLibAddress   :",defaultSendLibAddress);
    const defaultReceiveLibAddress = await endpointContract.defaultReceiveLibrary(srcEid);
    console.log("defaultReceiveLibAddress:",defaultReceiveLibAddress);
    console.log("=====================================================");
    const executorConfigType = 1; // 1 for executor
    const ulnConfigType = 2; // 2 for UlnConfig

    try {
        // Fetch and decode for sendLib (both Executor and ULN Config)
        const sendExecutorConfigBytes = await endpointContract.getConfig(
            oappAddress,
            sendLibAddress,
            destEid,
            executorConfigType,
        );
        const executorConfigAbi = ['tuple(uint32 maxMessageSize, address executorAddress)'];
        const executorConfigArray = hre.ethers.utils.defaultAbiCoder.decode(
            executorConfigAbi,
            sendExecutorConfigBytes,
        );
        console.log('Send Library Executor Config:', executorConfigArray);

        const sendUlnConfigBytes = await endpointContract.getConfig(
            oappAddress,
            sendLibAddress,
            destEid,
            ulnConfigType,
        );
        const ulnConfigStructType = [
            'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)',
        ];
        const sendUlnConfigArray = hre.ethers.utils.defaultAbiCoder.decode(
            ulnConfigStructType,
            sendUlnConfigBytes,
        );
        console.log('Send Library ULN Config:', sendUlnConfigArray);

        // Fetch and decode for receiveLib (only ULN Config)
        const receiveUlnConfigBytes = await endpointContract.getConfig(
            oappAddress,
            receiveLibAddress,
            destEid,
            ulnConfigType,
        );
        const receiveUlnConfigArray = hre.ethers.utils.defaultAbiCoder.decode(
            ulnConfigStructType,
            receiveUlnConfigBytes,
        );
        console.log('Receive Library ULN Config:', receiveUlnConfigArray);
    } catch (error) {
        console.error('Error fetching or decoding config:', error);
    }

})