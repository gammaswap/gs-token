import { task } from "hardhat/config"
import {Options} from "@layerzerolabs/lz-v2-utilities";
import { networkConfig } from "../helper-hardhat-config";

// run as "npx hardhat --network arbitrumSepolia bridge --from user0 --to 0x123... --net baseSepolia"
task("bridge", "Checks balance of address")
    .addOptionalParam("from", "Named account")
    .addOptionalParam("to", "Add token address")
    .addOptionalParam("net", "Add token address")
    .addOptionalParam("v", "Add token address").setAction(async (taskArgs, hre) => {
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
    const gs = await get("GS");
    log("gs:", gs.address)

    const gsContract = await hre.ethers.getContractAt("GS", gs.address);

    const resp = await gsContract.balanceOf(sender)
    console.log("resp >> ", hre.ethers.utils.formatEther(resp))

    sender = await hre.ethers.getSigner(sender);

    const dstNetwork = taskArgs.net
    const receiver = taskArgs.to
    console.log("receiver:",receiver)

    const cfg = networkConfig[dstNetwork]
    const lzEid = Number(cfg.lzEid || "0");
    const gsAddr = cfg.erc20Tokens?.gs || ""
    log("Sending to network",dstNetwork," >> lzEid:", lzEid," gs:",gsAddr)
    if(lzEid > 0 && hre.ethers.utils.isAddress(gsAddr)) {
        // Defining the amount of tokens to send and constructing the parameters for the send operation
        const tokensToSend = hre.ethers.utils.parseEther('1');

        // Defining extra message execution options for the send operation
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

        const sendParam = {
            dstEid: lzEid, // Destination endpoint ID.
            to: hre.ethers.utils.zeroPad(receiver, 32), // Recipient address.
            amountLD: tokensToSend, // Amount to send in local decimals.
            minAmountLD: tokensToSend, // Minimum amount to send in local decimals.
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
        await gsContract.connect(sender).send(sendParam, messagingFee, refundAddress,
            {value: messagingFee.nativeFee} // pass a msg.value to pay the LayerZero message fee
        );/**/
    }
})