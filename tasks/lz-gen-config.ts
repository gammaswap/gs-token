import { task } from "hardhat/config"
import { GS } from "../typechain-types";
import { generateConnectionsConfig } from "@layerzerolabs/metadata-tools";
import { OAppEnforcedOption, OmniPointHardhat } from "@layerzerolabs/toolbox-hardhat";
import { EndpointId } from "@layerzerolabs/lz-definitions";
import { ExecutorOptionType } from "@layerzerolabs/lz-v2-utilities";

// run as "npx hardhat --network arbitrumSepolia lz-get-config"
task("lz-gen-config", "Set delegate for GS token's endpoint")
    .setAction(async (taskArgs, hre) => {
        if (hre.network.name === "hardhat") {
            console.warn(
                "You are running on Hardhat network, which" +
                "gets automatically created and destroyed every time. Use the Hardhat" +
                " option '--network localhost'"
            )
        }

        const sonicContract: OmniPointHardhat = {
            eid: EndpointId.SONIC_MAINNET,
            contractName: 'GS',
        };

        const arbitrumContract: OmniPointHardhat = {
            eid: EndpointId.ARBITRUM_MAINNET,
            contractName: 'GS',
        };

        const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
            {
                msgType: 1,
                optionType: ExecutorOptionType.LZ_RECEIVE,
                gas: 200000,
                value: 0,
            }/*,
            {
                msgType: 2,
                optionType: ExecutorOptionType.LZ_RECEIVE,
                gas: 200000,
                value: 0,
            },
            {
                msgType: 2,
                optionType: ExecutorOptionType.COMPOSE,
                index: 0,
                gas: 80000,
                value: 0,
            },/**/
        ];

        // note: pathways declared here are automatically bidirectional
        // if you declare A,B there's no need to declare B,A
        const connections = await generateConnectionsConfig([
            [
                sonicContract, // Chain A contract
                arbitrumContract, // Chain B contract
                [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
                [1, 1], // [A to B confirmations, B to A confirmations]
                [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS], // Chain B enforcedOptions, Chain A enforcedOptions
            ],
        ]);
        console.log("connections >>",connections)
        console.log("----------------------------------------------------")
    }
);
