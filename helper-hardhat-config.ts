export interface networkConfigItem {
    blockConfirmations?: number
    longBlockConfirmations?: number
    erc20Tokens?: ERC20Info
    timelock?: TimeLockInfo
    lzEndpoint?: string
    lzEid?: number
    initialGSTokenAmt?: string
    mintGSTokenTo?: string
}

export interface networkConfigInfo {
    [key: string]: networkConfigItem
}

export interface TimeLockInfo {
    minDelay?: number
    proposers?: string[]
    executors?: string[]
    admin?: string
}

export interface ERC20Info {
    [key: string]: string
}

export const networkConfig: networkConfigInfo = {
    localhost: {},
    hardhat: {},
    mainnet: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        lzEid: 30101,
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        initialGSTokenAmt: "1300000000",
        mintGSTokenTo: "0x73c510b2A44B51a01A13A3539c38EB330FB9713D", // mainnet multisig
        timelock: {
            minDelay: 60, // 1 minute
            proposers: ["0x49eeAED06f17b192Eb2131367F2646af0b48F7b1"], // mainnet multisig
            executors: ["0x49eeAED06f17b192Eb2131367F2646af0b48F7b1"], // mainnet multisig
        },
        erc20Tokens: {
            gs: '0x64d3CAe387405d91f7b0D91fb1D824A281719500',
            weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        }
    },
    sepolia: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        lzEid: 40161,
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        erc20Tokens: {
            weth: '',
            gs: '0x63Aa1F040c35106d9979aeC22b624E8524E6D21E',
        }
    },
    arbitrumSepolia: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        lzEid: 40231,
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        initialGSTokenAmt: "1600000000",
        erc20Tokens: {
            weth: '',
            gs: '0xe2E368617BA3671f586B0959C46FE6B2b97c35D5',
        },
        timelock: {
            proposers: ["0x7B08e1Cf4C60Fd942Fa0C004F2739B8B8fA46e80","0x3429de008b6d3c85744b639511c8854d52c8f6ab"],
            executors: ["0x7B08e1Cf4C60Fd942Fa0C004F2739B8B8fA46e80","0x3429de008b6d3c85744b639511c8854d52c8f6ab"],
        }
    },
    arbitrum: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        lzEid: 30110,
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        initialGSTokenAmt: "300000000",
        mintGSTokenTo: "0xa075f1B6f50a1a02Ba22c3B43D72917a326b16c0", // LBP multisig
        timelock: {
            minDelay: 60, // 1 minute
            proposers: ["0xe04f3384780e71e8DACD7A0790A0668903560E16"], // arbitrum multisig
            executors: ["0xe04f3384780e71e8DACD7A0790A0668903560E16"], // arbitrum multisig
        },
        erc20Tokens: {
            gs: '0xb08D8BeCAB1bf76A9Ce3d2d5fa946F65EC1d3e83',
            weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            weeth: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
            usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            usdc_e: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            arb: '0x912CE59144191C1204E64559FE8253a0e49E6548',
            dpx: '0x6C2C06790b3E3E3c38e12Ee22F8183b37a13EE55',
            magic: '0x539bdE0d7Dbd336b79148AA742883198BBF60342',
            wbtc: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            gmx: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
            pendle: '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8',
            rdnt: '0x3082CC23568eA640225c2467653dB90e9250AaA0',
            gns: '0x18c11FD286C5EC11c3b683Caa813B77f5163A122',
            ptWEETH26SEP2024: '0xb8b0a120f6a68dd06209619f62429fb1a8e92fec',
            ptEZETH26SEP2024: '0x2ccfce9be49465cc6f947b5f6ac9383673733da9',
        }
    },
    base: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        lzEid: 30184,
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        mintGSTokenTo: "0xaeAAc90117fb85a7DC961522DdFe96ABB358445B", // base multisig
        timelock: {
            minDelay: 60, // 1 minute
            proposers: ["0x507e48b87a50d323073c8EFA727B2d696E528EaB"], // base multisig
            executors: ["0x507e48b87a50d323073c8EFA727B2d696E528EaB"], // base multisig
        },
        erc20Tokens: {
            gs: '0xc4d44c155f95FD4E94600d191a4a01bb571dF7DF',
            weth: '0x4200000000000000000000000000000000000006',
            usdc: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        },
    },
    baseSepolia: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        lzEid: 40245,
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        erc20Tokens: {
            weth: '',
            gs:'0x61b655b617165a0504AbA43cb17f0aD72fE86078',
        },
    },
}

export const developmentLzPeers = ["arbitrumSepolia", "baseSepolia", "sepolia"]
export const productionLzPeers = ["arbitrum", "base", "mainnet"]

export const developmentChains = ["hardhat", "localhost"]
export const proposalsFile = "proposals.json"

// Governor Values
export const QUORUM_PERCENTAGE = 4 // Need 4% of voters to pass
export const MIN_DELAY = 3600 // 1 hour - after a vote passes, you have 1 hour before you can enact
// export const VOTING_PERIOD = 45818 // 1 week - how long the vote lasts. This is pretty long even for local tests
export const VOTING_PERIOD = 5 // blocks
//export const VOTING_DELAY = 19200 // 3 day - How many blocks till a proposal vote becomes active
export const VOTING_DELAY = 1 // 1 Block - How many blocks till a proposal vote becomes active
//export const PROPOSAL_THRESHOLD = "1000000000000000000" // 1% (1e18) of token supply
export const PROPOSAL_THRESHOLD = 0 // % of token supply
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

export const NEW_STORE_VALUE = 77
export const FUNC = "store"
export const PROPOSAL_DESCRIPTION = "Proposal #1 77 in the Box!"
