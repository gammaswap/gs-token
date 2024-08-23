import { run } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "./helper-hardhat-config";
import { BigNumber } from "ethers";

export const verify = async (contractAddress: string, args: any[]) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e: any) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

export const deployContractFromBytecode = async (deployer: string, contractName: string, args: any[], abi: any, bytecode: string, hre: HardhatRuntimeEnvironment) => {
    const { deployments, network } = hre
    const { deploy, log } = deployments
    log("----------------------------------------------------")
    log(`Deploying ${contractName} and waiting for confirmations...`)
    const _contract = await deploy(contractName, {
        from: deployer,
        args: args,
        log: true,
        contract: {
            abi: abi,
            bytecode: bytecode
        },
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(_contract.address, args)
    }
    log(`${contractName} at ${_contract.address}`)
    return _contract
}

export const deployContract = async (deployer: string, contractName: string, args: any[], hre: HardhatRuntimeEnvironment) => {
    const { deployments, network } = hre
    const { deploy, log } = deployments
    log("----------------------------------------------------")
    log(`Deploying ${contractName} and waiting for confirmations...`)
    const _contract = await deploy(contractName, {
        from: deployer,
        args: args,
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(_contract.address, args)
    }
    log(`${contractName} at ${_contract.address}`)
    return _contract
}

export const deployContractByArtifact = async (deployer: string, contractName: string, artifactName: string, args: any[], hre: HardhatRuntimeEnvironment) => {
    const { deployments, network } = hre
    const { deploy, log } = deployments
    log("----------------------------------------------------")
    log(`Deploying ${contractName} and waiting for confirmations...`)
    const _contract = await deploy(contractName, {
        from: deployer,
        contract: artifactName,
        args: args,
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(_contract.address, args)
    }
    log(`${contractName} at ${_contract.address}`)
    return _contract
}

export const deployContractWithLibs = async (deployer: string, contractName: string, args: any[], libraryArgs: any, hre: HardhatRuntimeEnvironment) => {
    const { deployments, network } = hre
    const { deploy, log } = deployments
    log("----------------------------------------------------")
    log(`Deploying ${contractName} and waiting for confirmations...`)
    const _contract = await deploy(contractName, {
        from: deployer,
        args: args,
        log: true,
        libraries: libraryArgs,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(_contract.address, args)
    }
    log(`${contractName} at ${_contract.address}`)
    return _contract
}

export const deployProxyContract = async (deployer: string, contractName: string, args: any[], proxyArgs: any[], hre: HardhatRuntimeEnvironment) => {
    const { deployments, network } = hre
    const { deploy, log } = deployments
    log("----------------------------------------------------")
    log(`Deploying proxy for ${contractName} and waiting for confirmations...`)
    const _contract = await deploy(contractName, {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
        proxy: {
            execute: {
                init: {
                    methodName: "initialize",
                    args: proxyArgs
                },
            },
            proxyContract: "UUPS"
        }
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(_contract.address, args)
    }
    log(`${contractName} at ${_contract.address}`)
    return _contract
}

export const sqrt = (y: BigNumber): BigNumber => {
    let z = BigNumber.from(0);
    if (y.gt(3)) {
        z = y;
        let x = y.div(2).add(1);
        while (x.lt(z)) {
            z = x;
            x = y.div(x).add(x).div(2);
        }
    } else if (!y.isZero()) {
        z = BigNumber.from(1);
    }
    return z;
};

export type JSONObj = {
    [key: string]: string
}

export type TokenMap = {
    [key: string]: Token
}

export type Token = {
    address: string
    symbol: string
    imgPath: string
    decimals: number
}

export interface Mock {
    contracts: JSONObj
    tokens: JSONObj
    uniPairs: JSONObj
    balPairs: JSONObj
    gsPools: JSONObj
    gammaPools: GammaPool[]
    tokenMap: TokenMap
}

export type GammaPool = {
    address: string
    cfmm: string
    token0: string
    token1: string
    totalSupplied: string
    totalBorrowed: string
    supplyAPY: string
    borrowAPY: string
    lpTokenBalance: string
    lpTokenBorrowed: string
    accFeeIndex: string
    lastFeeIndex: string
    lpTokenBorrowedPlusInterest: string
    lpInvariant: string
    lpBorrowedInvariant: string
    lastBlockNumber: string
}

export const isMainnet = (hre: HardhatRuntimeEnvironment) => {
    return hre.network.name === "arbitrum" || hre.network.name == "mainnet" || hre.network.name == "base";
}