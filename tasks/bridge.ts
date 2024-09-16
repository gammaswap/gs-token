import { task } from "hardhat/config"
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { networkConfig } from "../helper-hardhat-config";

// run as "npx hardhat --network arbitrumSepolia bridge --from user0 --to 0x123... --net baseSepolia"
task("bridge", "Checks balance of address")
    .addOptionalParam("from", "Named account sending amount from e.g. user0, deployer, etc.")
    .addOptionalParam("to", "Destination address to send amount to")
    .addOptionalParam("net", "Destination network")
    .addOptionalParam("amount", "Amount of tokens to send")
    .addOptionalParam("exec", "Set to > 0 to execute")
    .addOptionalParam("v", "Set > 0 to print available addresses by name").setAction(async (taskArgs, hre) => {
    if (hre.network.name === "hardhat") {
        console.warn(
            "You are running on Hardhat network, which" +
            "gets automatically created and destroyed every time. Use the Hardhat" +
            " option '--network localhost'"
        )
    }

    const { getNamedAccounts, deployments, network } = hre
    const { log, get } = deployments
    const namedAccounts = await getNamedAccounts()
    let sender;
    if(!!taskArgs.v) {
        console.log("namedAccounts >> ", namedAccounts)
    }

    if(!!taskArgs.from) {
        sender = namedAccounts[taskArgs.from]
    } else {
        sender = namedAccounts["deployer"]
    }
    console.log("sender >> ", sender)
    if(!hre.ethers.utils.isAddress(sender)) {
        console.log("Error: invalid sender >>", sender)
        return
    }
    const receiver = taskArgs.to || sender
    console.log("receiver:",receiver)

    const gs = await get("GS");
    console.log("gs:", gs.address)

    const gsContract = await hre.ethers.getContractAt("GS", gs.address);

    const balance = await gsContract.balanceOf(sender)
    const balanceStr = hre.ethers.utils.formatEther(balance)
    console.log("balance >> ", balanceStr)

    const amountStr = taskArgs.amount || "0"
    const amount = hre.ethers.utils.parseEther(amountStr)
    console.log("amount: ", amountStr)
    console.log("amountBN:",amount.toString())
    if(amount.gt(balance)) {
        console.log("not enough balance:",balanceStr,"<",amountStr)
        return;
    }

    const dstNetwork = taskArgs.net

    const cfg = networkConfig[dstNetwork]
    if(!cfg) {
        console.log("Please provide network `--net` e.g. arbitrumSepolia, sepolia, etc.")
        return;
    }

    const lzEid = Number(cfg.lzEid || "0");
    const gsAddr = cfg.erc20Tokens?.gs || ""
    console.log("Sending to network",dstNetwork," >> lzEid:", lzEid," gs:",gsAddr)
    if(amount.eq(0)) {
        return
    }
    if(!taskArgs.exec) {
        console.log("Set exec > 0 to execute tx")
        return
    }
    if(lzEid > 0 && hre.ethers.utils.isAddress(gsAddr)) {
        sender = await hre.ethers.getSigner(sender);

        // Defining extra message execution options for the send operation
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

        const sendParam = {
            dstEid: lzEid, // Destination endpoint ID.
            to: hre.ethers.utils.zeroPad(receiver, 32), // Recipient address.
            amountLD: amount, // Amount to send in local decimals.
            minAmountLD: amount, // Minimum amount to send in local decimals.
            extraOptions: options, // Additional options supplied by the caller to be used in the LayerZero message.
            composeMsg: "0x", // The composed message for the send() operation.
            oftCmd: "0x" // The OFT command to be executed, unused in default OFT implementations.
        }

        // Fetching the native fee for the token send operation (nativeFee, lzTokenFee)
        let [nativeFee, lzTokenFee] = await gsContract.quoteSend(sendParam, false);

        console.log("nativeFee:",nativeFee.toString())
        console.log("lzTokenFee:",lzTokenFee.toString())

        const messagingFee = {
            nativeFee: nativeFee,
            lzTokenFee: lzTokenFee
        }

        // Executing the send operation from GS contract in local network
        let refundAddress = sender.address;
        const tx = await (await gsContract.connect(sender).send(sendParam, messagingFee, refundAddress,
            {value: messagingFee.nativeFee} // pass a msg.value to pay the LayerZero message fee
        )).wait();

        if(tx && tx.transactionHash) {
            console.log("execute send at", tx.transactionHash)
        }
    } else {
        console.log("Error: Invalid lzEid",lzEid,"or gsAddr",gsAddr,"in configurations")
    }
})