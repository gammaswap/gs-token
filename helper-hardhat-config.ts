export interface networkConfigItem {
    blockConfirmations?: number
    longBlockConfirmations?: number
    erc20Tokens?: ERC20Info
    timelock?: TimeLockInfo
    lzEndpoint?: string
    lzEid?: number
    lzSendLib?: string
    lzReceiveLib?: string
    lzExecutor?: string
    lzSendULNConfig?: dvnConfigInfo
    lzReceiveULNConfig?: dvnConfigInfo
    initialGSTokenAmt?: string
    mintGSTokenTo?: string
}

export interface dvnConfigItem {
    requiredDVNCount: number
    confirmations: number
    requiredDVNs: string[]
    optionalDVNCount?: number
    optionalDVNThreshold?: number
    optionalDVNs?: string[]
}

export interface dvnConfigInfo {
    [key: string]: dvnConfigItem
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
        initialGSTokenAmt: "1300000000",
        mintGSTokenTo: "0x73c510b2A44B51a01A13A3539c38EB330FB9713D", // mainnet multisig
        timelock: {
            minDelay: 24 * 60 * 60, // 1 day in seconds
            proposers: ["0x49eeAED06f17b192Eb2131367F2646af0b48F7b1"], // mainnet multisig
            executors: ["0x49eeAED06f17b192Eb2131367F2646af0b48F7b1"], // mainnet multisig
        },
        erc20Tokens: {
            gs: '0x64d3CAe387405d91f7b0D91fb1D824A281719500',
            weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        },
        lzEid: 30101,
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        lzSendLib: "0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1",
        lzReceiveLib: "0xc02Ab410f0734EFa3F14628780e6e695156024C2",
        lzExecutor: "0x173272739Bd7Aa6e4e214714048a9fE699453059",
        lzSendULNConfig: {
            arbitrum: {
                confirmations: 15,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x380275805876ff19055ea900cdb2b46a94ecf20d', // Horizen
                    '0x589dedbd617e0cbcb916a9223f4d1300c294236b', // LayerZero Labs
                    '0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd', // Canary
                    '0xa59ba433ac34d2927232918ef5b2eaafcf130ba5', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            base: {
                confirmations: 15,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x380275805876ff19055ea900cdb2b46a94ecf20d', // Horizen
                    '0x589dedbd617e0cbcb916a9223f4d1300c294236b', // LayerZero Labs
                    '0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd', // Canary
                    '0xa59ba433ac34d2927232918ef5b2eaafcf130ba5', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonic: {
                confirmations: 15,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x380275805876ff19055ea900cdb2b46a94ecf20d', // Horizen
                    '0x589dedbd617e0cbcb916a9223f4d1300c294236b', // LayerZero Labs
                    '0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd', // Canary
                    '0xa59ba433ac34d2927232918ef5b2eaafcf130ba5', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        },
        lzReceiveULNConfig: {
            arbitrum: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x380275805876ff19055ea900cdb2b46a94ecf20d', // Horizen
                    '0x589dedbd617e0cbcb916a9223f4d1300c294236b', // LayerZero Labs
                    '0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd', // Canary
                    '0xa59ba433ac34d2927232918ef5b2eaafcf130ba5', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            base: {
                confirmations: 10,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x380275805876ff19055ea900cdb2b46a94ecf20d', // Horizen
                    '0x589dedbd617e0cbcb916a9223f4d1300c294236b', // LayerZero Labs
                    '0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd', // Canary
                    '0xa59ba433ac34d2927232918ef5b2eaafcf130ba5', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonic: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x380275805876ff19055ea900cdb2b46a94ecf20d', // Horizen
                    '0x589dedbd617e0cbcb916a9223f4d1300c294236b', // LayerZero Labs
                    '0xa4fe5a5b9a846458a70cd0748228aed3bf65c2cd', // Canary
                    '0xa59ba433ac34d2927232918ef5b2eaafcf130ba5', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        }
    },
    sepolia: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        erc20Tokens: {
            weth: '',
            gs: '0x63Aa1F040c35106d9979aeC22b624E8524E6D21E',
        },
        lzEid: 40161,
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        lzSendLib: "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE",
        lzReceiveLib: "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851",
        lzExecutor: "0x718B92b5CB0a5552039B593faF724D182A881eDA",
        lzSendULNConfig: {
            arbitrumSepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x68802e01d6321d5159208478f297d7007a7516ed', // Nethermind
                    '0x843139c725c2fb9814de6a12fb890d8dbf3e1698', // Horizen
                    '0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            baseSepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x68802e01d6321d5159208478f297d7007a7516ed', // Nethermind
                    '0x843139c725c2fb9814de6a12fb890d8dbf3e1698', // Horizen
                    '0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonicTestnet: {
                confirmations: 3,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        },
        lzReceiveULNConfig: {
            arbitrumSepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x68802e01d6321d5159208478f297d7007a7516ed', // Nethermind
                    '0x843139c725c2fb9814de6a12fb890d8dbf3e1698', // Horizen
                    '0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            baseSepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x68802e01d6321d5159208478f297d7007a7516ed', // Nethermind
                    '0x843139c725c2fb9814de6a12fb890d8dbf3e1698', // Horizen
                    '0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonicTestnet: {
                confirmations: 3,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        }
    },
    arbitrumSepolia: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        initialGSTokenAmt: "1600000000",
        erc20Tokens: {
            weth: '',
            gs: '0xe2E368617BA3671f586B0959C46FE6B2b97c35D5',
        },
        timelock: {
            proposers: ["0x7B08e1Cf4C60Fd942Fa0C004F2739B8B8fA46e80","0x3429de008b6d3c85744b639511c8854d52c8f6ab"],
            executors: ["0x7B08e1Cf4C60Fd942Fa0C004F2739B8B8fA46e80","0x3429de008b6d3c85744b639511c8854d52c8f6ab"],
        },
        lzEid: 40231,
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        lzSendLib: "0x4f7cd4DA19ABB31b0eC98b9066B9e857B1bf9C0E",
        lzReceiveLib: "0x75Db67CDab2824970131D5aa9CECfC9F69c69636",
        lzExecutor: "0x5Df3a1cEbBD9c8BA7F8dF51Fd632A9aef8308897",
        lzSendULNConfig: {
            baseSepolia: {
                confirmations: 2,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x3a74f7174709842d3b8a14ce60b4aa2499f2a2f2', // Nethermind
                    '0x53f488e93b4f1b60e8e83aa374dbe1780a1ee8a8', // LayerZero Labs
                    '0xc6cec4e6b8f3dc87e676d06a24864081311eda15', // Horizen
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x3a74f7174709842d3b8a14ce60b4aa2499f2a2f2', // Nethermind
                    '0x53f488e93b4f1b60e8e83aa374dbe1780a1ee8a8', // LayerZero Labs
                    '0xc6cec4e6b8f3dc87e676d06a24864081311eda15', // Horizen
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonicTestnet: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x53f488e93b4f1b60e8e83aa374dbe1780a1ee8a8', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        },
        lzReceiveULNConfig: {
            baseSepolia: {
                confirmations: 2,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x3a74f7174709842d3b8a14ce60b4aa2499f2a2f2', // Nethermind
                    '0x53f488e93b4f1b60e8e83aa374dbe1780a1ee8a8', // LayerZero Labs
                    '0xc6cec4e6b8f3dc87e676d06a24864081311eda15', // Horizen
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0x3a74f7174709842d3b8a14ce60b4aa2499f2a2f2', // Nethermind
                    '0x53f488e93b4f1b60e8e83aa374dbe1780a1ee8a8', // LayerZero Labs
                    '0xc6cec4e6b8f3dc87e676d06a24864081311eda15', // Horizen
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonicTestnet: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x53f488e93b4f1b60e8e83aa374dbe1780a1ee8a8', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        }
    },
    arbitrum: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        initialGSTokenAmt: "300000000",
        mintGSTokenTo: "0xa075f1B6f50a1a02Ba22c3B43D72917a326b16c0", // LBP multisig
        timelock: {
            minDelay: 24 * 60 * 60, // 1 day in seconds
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
        },
        lzEid: 30110,
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        lzSendLib: "0x975bcD720be66659e3EB3C0e4F1866a3020E493A",
        lzReceiveLib: "0x7B9E184e07a6EE1aC23eAe0fe8D6Be2f663f05e6",
        lzExecutor: "0x31CAe3B7fB82d847621859fb1585353c5720660D",
        lzSendULNConfig: {
            base: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x19670Df5E16bEa2ba9b9e68b48C054C5bAEa06B8', // Horizen
                    '0x2f55C492897526677C5B68fb199ea31E2c126416', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Nethermind
                    '0xf2E380c90e6c09721297526dbC74f870e114dfCb', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            mainnet: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x19670Df5E16bEa2ba9b9e68b48C054C5bAEa06B8', // Horizen
                    '0x2f55C492897526677C5B68fb199ea31E2c126416', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Nethermind
                    '0xf2E380c90e6c09721297526dbC74f870e114dfCb', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonic: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x19670df5e16bea2ba9b9e68b48c054c5baea06b8', // Horizen
                    '0x2f55c492897526677c5b68fb199ea31e2c126416', // LayerZero Labs
                    '0xa7b5189bca84cd304d8553977c7c614329750d99', // Nethermind
                    '0xf2e380c90e6c09721297526dbc74f870e114dfcb', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        },
        lzReceiveULNConfig: {
            base: {
                confirmations: 10,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x19670Df5E16bEa2ba9b9e68b48C054C5bAEa06B8', // Horizen
                    '0x2f55C492897526677C5B68fb199ea31E2c126416', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Nethermind
                    '0xf2E380c90e6c09721297526dbC74f870e114dfCb', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            mainnet: {
                confirmations: 15,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x19670Df5E16bEa2ba9b9e68b48C054C5bAEa06B8', // Horizen
                    '0x2f55C492897526677C5B68fb199ea31E2c126416', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Nethermind
                    '0xf2E380c90e6c09721297526dbC74f870e114dfCb', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonic: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x19670df5e16bea2ba9b9e68b48c054c5baea06b8', // Horizen
                    '0x2f55c492897526677c5b68fb199ea31e2c126416', // LayerZero Labs
                    '0xa7b5189bca84cd304d8553977c7c614329750d99', // Nethermind
                    '0xf2e380c90e6c09721297526dbc74f870e114dfcb', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        }
    },
    base: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        mintGSTokenTo: "0xaeAAc90117fb85a7DC961522DdFe96ABB358445B", // base multisig
        timelock: {
            minDelay: 24 * 60 * 60, // 1 day in seconds
            proposers: ["0x507e48b87a50d323073c8EFA727B2d696E528EaB"], // base multisig
            executors: ["0x507e48b87a50d323073c8EFA727B2d696E528EaB"], // base multisig
        },
        erc20Tokens: {
            gs: '0xc4d44c155f95FD4E94600d191a4a01bb571dF7DF',
            weth: '0x4200000000000000000000000000000000000006',
            usdc: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        },
        lzEid: 30184,
        lzEndpoint: "0x1a44076050125825900e736c501f859c50fE728c",
        lzSendLib: "0xB5320B0B3a13cC860893E2Bd79FCd7e13484Dda2",
        lzReceiveLib: "0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf",
        lzExecutor: "0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4",
        lzSendULNConfig: {
            arbitrum: {
                confirmations: 10,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x554833698Ae0FB22ECC90B01222903fD62CA4B47', // Canary
                    '0x9e059a54699a285714207b43B055483E78FAac25', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Horizen
                    '0xcd37CA043f8479064e10635020c65FfC005d36f6', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            mainnet: {
                confirmations: 10,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x554833698Ae0FB22ECC90B01222903fD62CA4B47', // Canary
                    '0x9e059a54699a285714207b43B055483E78FAac25', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Horizen
                    '0xcd37CA043f8479064e10635020c65FfC005d36f6', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonic: {
                confirmations: 10,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x554833698Ae0FB22ECC90B01222903fD62CA4B47', // Canary
                    '0x9e059a54699a285714207b43b055483e78faac25', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Horizen
                    '0xcd37ca043f8479064e10635020c65ffc005d36f6', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        },
        lzReceiveULNConfig: {
            arbitrum: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x554833698Ae0FB22ECC90B01222903fD62CA4B47', // Canary
                    '0x9e059a54699a285714207b43B055483E78FAac25', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Horizen
                    '0xcd37CA043f8479064e10635020c65FfC005d36f6', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            mainnet: {
                confirmations: 15,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x554833698Ae0FB22ECC90B01222903fD62CA4B47', // Canary
                    '0x9e059a54699a285714207b43B055483E78FAac25', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Horizen
                    '0xcd37CA043f8479064e10635020c65FfC005d36f6', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonic: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x554833698Ae0FB22ECC90B01222903fD62CA4B47', // Canary
                    '0x9e059a54699a285714207b43b055483e78faac25', // LayerZero Labs
                    '0xa7b5189bcA84Cd304D8553977c7C614329750d99', // Horizen
                    '0xcd37ca043f8479064e10635020c65ffc005d36f6', // Nethermind
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        }
    },
    baseSepolia: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        erc20Tokens: {
            weth: '',
            gs:'0x61b655b617165a0504AbA43cb17f0aD72fE86078',
        },
        lzEid: 40245,
        lzEndpoint: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        lzSendLib: "0xC1868e054425D378095A003EcbA3823a5D0135C9",
        lzReceiveLib: "0x12523de19dc41c91F7d2093E0CFbB76b17012C8d",
        lzExecutor: "0x8A3D588D9f6AC041476b094f97FF94ec30169d3D",
        lzSendULNConfig: {
            arbitrumSepolia: {
                confirmations: 2,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0xb1b2319767b86800c4cfe8623a72c00d9d90cfb6', // Horizen
                    '0xd9222cc3ccd1df7c070d700ea377d4ada2b86eb5', // Nethermind
                    '0xe1a12515f9ab2764b887bf60b923ca494ebbb2d6', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0xb1b2319767b86800c4cfe8623a72c00d9d90cfb6', // Horizen
                    '0xd9222cc3ccd1df7c070d700ea377d4ada2b86eb5', // Nethermind
                    '0xe1a12515f9ab2764b887bf60b923ca494ebbb2d6', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonicTestnet: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        },
        lzReceiveULNConfig: {
            arbitrumSepolia: {
                confirmations: 2,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0xb1b2319767b86800c4cfe8623a72c00d9d90cfb6', // Horizen
                    '0xd9222cc3ccd1df7c070d700ea377d4ada2b86eb5', // Nethermind
                    '0xe1a12515f9ab2764b887bf60b923ca494ebbb2d6', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sepolia: {
                confirmations: 3,
                requiredDVNCount: 3,
                requiredDVNs: [
                    '0xb1b2319767b86800c4cfe8623a72c00d9d90cfb6', // Horizen
                    '0xd9222cc3ccd1df7c070d700ea377d4ada2b86eb5', // Nethermind
                    '0xe1a12515f9ab2764b887bf60b923ca494ebbb2d6', // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sonicTestnet: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        }
    },
    sonic: {
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        timelock: {
            minDelay: 24 * 60 * 60, // 1 day in seconds
            proposers: ["0x507e48b87a50d323073c8EFA727B2d696E528EaB"], // sonic multisig
            executors: ["0x507e48b87a50d323073c8EFA727B2d696E528EaB"], // sonic multisig
        },
        erc20Tokens: {
            gs: '0xf9F143705b2BBDE9b4ABfD0320F328aE59364f5e',
            weth: '0x50c42deacd8fc9773493ed674b675be577f2634b',
        },
        lzEid: 30332,
        lzEndpoint: "0x6F475642a6e85809B1c36Fa62763669b1b48DD5B",
        lzSendLib: "0xC39161c743D0307EB9BCc9FEF03eeb9Dc4802de7",
        lzReceiveLib: "0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043",
        lzExecutor: "0x4208D6E27538189bB48E603D6123A94b8Abe0A0b",
        lzSendULNConfig: {
            base: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x05AaEfDf9dB6E0f7d27FA3b6EE099EDB33dA029E', // Nethermind
                    '0x282b3386571f7f794450d5789911a9804FA346b4', // LayerZero Labs
                    '0x54dd79f5ce72b51fcbbcb170dd01e32034323565', // Horizen
                    '0xb2c7832aa8dda878de6f949485f927e9e532e92c', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            arbitrum: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x05AaEfDf9dB6E0f7d27FA3b6EE099EDB33dA029E', // Nethermind
                    '0x282b3386571f7f794450d5789911a9804FA346b4', // LayerZero Labs
                    '0x54dd79f5ce72b51fcbbcb170dd01e32034323565', // Horizen
                    '0xb2c7832aa8dda878de6f949485f927e9e532e92c', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            mainnet: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x05AaEfDf9dB6E0f7d27FA3b6EE099EDB33dA029E', // Nethermind
                    '0x282b3386571f7f794450d5789911a9804FA346b4', // LayerZero Labs
                    '0x54dd79f5ce72b51fcbbcb170dd01e32034323565', // Horizen
                    '0xb2c7832aa8dda878de6f949485f927e9e532e92c', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        },
        lzReceiveULNConfig: {
            base: {
                confirmations: 10,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x05AaEfDf9dB6E0f7d27FA3b6EE099EDB33dA029E', // Nethermind
                    '0x282b3386571f7f794450d5789911a9804FA346b4', // LayerZero Labs
                    '0x54dd79f5ce72b51fcbbcb170dd01e32034323565', // Horizen
                    '0xb2c7832aa8dda878de6f949485f927e9e532e92c', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            arbitrum: {
                confirmations: 20,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x05AaEfDf9dB6E0f7d27FA3b6EE099EDB33dA029E', // Nethermind
                    '0x282b3386571f7f794450d5789911a9804FA346b4', // LayerZero Labs
                    '0x54dd79f5ce72b51fcbbcb170dd01e32034323565', // Horizen
                    '0xb2c7832aa8dda878de6f949485f927e9e532e92c', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            mainnet: {
                confirmations: 15,
                requiredDVNCount: 4,
                requiredDVNs: [
                    '0x05AaEfDf9dB6E0f7d27FA3b6EE099EDB33dA029E', // Nethermind
                    '0x282b3386571f7f794450d5789911a9804FA346b4', // LayerZero Labs
                    '0x54dd79f5ce72b51fcbbcb170dd01e32034323565', // Horizen
                    '0xb2c7832aa8dda878de6f949485f927e9e532e92c', // Canary
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            }
        }
    },
    sonicTestnet: { // Blaze
        blockConfirmations: 2,
        longBlockConfirmations: 3,
        erc20Tokens: {
            gs: '0x33F179fABa05D274e9eaeae643a758a8a84c1269',
            weth: '',
        },
        timelock: {
            proposers: ["0x7B08e1Cf4C60Fd942Fa0C004F2739B8B8fA46e80","0x3429de008b6d3c85744b639511c8854d52c8f6ab"],
            executors: ["0x7B08e1Cf4C60Fd942Fa0C004F2739B8B8fA46e80","0x3429de008b6d3c85744b639511c8854d52c8f6ab"],
        },
        lzEid: 40349,
        lzEndpoint: "0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff",
        lzSendLib: "0xd682ECF100f6F4284138AA925348633B0611Ae21",
        lzReceiveLib: "0xcF1B0F4106B0324F96fEfcC31bA9498caa80701C",
        lzExecutor: "0x9dB9Ca3305B48F196D18082e91cB64663b13d014",
        lzSendULNConfig: {
            arbitrumSepolia: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x88b27057a9e00c5f05dda29241027aff63f9e6e0' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            baseSepolia: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x88b27057a9e00c5f05dda29241027aff63f9e6e0' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sepolia: {
                confirmations: 3,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x88b27057a9e00c5f05dda29241027aff63f9e6e0' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
        },
        lzReceiveULNConfig: {
            arbitrumSepolia: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x88b27057a9e00c5f05dda29241027aff63f9e6e0' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            baseSepolia: {
                confirmations: 2,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x88b27057a9e00c5f05dda29241027aff63f9e6e0' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
            sepolia: {
                confirmations: 3,
                requiredDVNCount: 1,
                requiredDVNs: [
                    '0x88b27057a9e00c5f05dda29241027aff63f9e6e0' // LayerZero Labs
                ],
                optionalDVNCount: 255,
                optionalDVNThreshold: 0,
                optionalDVNs: [],
            },
        }
    },
}

export const developmentLzPeers = ["arbitrumSepolia", "baseSepolia", "sepolia", "sonicTestnet"]
export const productionLzPeers = ["arbitrum", "base", "mainnet", "sonic"]

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
