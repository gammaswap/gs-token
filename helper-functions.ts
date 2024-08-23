import { ethers, run } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "./helper-hardhat-config";
import { BigNumber, Contract } from "ethers";
import path from "path";
import fs from "fs";

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

export async function storeToken(tokenMap: TokenMap, imgPath: string, token: Contract) {
    const symbol = await token.symbol()
    const decimals = await token.decimals()
    const tokenObj: Token = {
        address: token.address,
        symbol: symbol,
        imgPath: imgPath,
        decimals: decimals,
    }
    if (tokenMap[token.address] == null) tokenMap[token.address] = tokenObj
}
export async function storeGammaPool(
    mockDataGammaPools: GammaPool[],
    cfmmAddress: string,
    tokenMap: TokenMap,
    pool: Contract,
) {
    const tokensFromContract = await pool.tokens()

    const token0 = tokenMap[tokensFromContract[0]]
    const token1 = tokenMap[tokensFromContract[1]]

    const ZERO_BN = BigNumber.from("0")

    const poolItems: GammaPool = {
        address: pool.address,
        cfmm: cfmmAddress,
        token0: tokensFromContract[0],
        token1: tokensFromContract[1],
        totalSupplied: "",
        totalBorrowed: "",
        supplyAPY: "",
        borrowAPY: "",
        lpTokenBalance: "0",
        lpTokenBorrowed: "0",
        accFeeIndex: "0",
        lastFeeIndex: "0",
        lpTokenBorrowedPlusInterest: "0",
        lpInvariant: "0",
        lpBorrowedInvariant: "0",
        lastBlockNumber: "0",
    }

    mockDataGammaPools.push(poolItems)
}

export async function storeBalancerGammaPool(
    mockDataGammaPools: GammaPool[],
    cfmmAddress: string,
    pool: Contract,
    token0: Contract,
    token1: Contract
) {
    let TOKENS: string[] = [];

    if (BigNumber.from(token0.address).lt(BigNumber.from(token1.address))) {
        TOKENS = [token0.address, token1.address];
    } else {
        TOKENS = [token1.address, token0.address];
    }

    const poolItems: GammaPool = {
        address: pool.address,
        cfmm: cfmmAddress,
        token0: TOKENS[0],
        token1: TOKENS[1],
        totalSupplied: "",
        totalBorrowed: "",
        supplyAPY: "",
        borrowAPY: "",
        lpTokenBalance: "0",
        lpTokenBorrowed: "0",
        accFeeIndex: "0",
        lastFeeIndex: "0",
        lpTokenBorrowedPlusInterest: "0",
        lpInvariant: "0",
        lpBorrowedInvariant: "0",
        lastBlockNumber: "0",
    }

    mockDataGammaPools.push(poolItems)
}

export async function setPoolParams(signer: any, gsFactoryAddress: string, gammaPoolAddress: string, params: any[], confirmations: number) {
    const gsFactory = await ethers.getContractAt("GammaPoolFactory", gsFactoryAddress);
    const poolContract = await ethers.getContractAt("CPMMGammaPool", gammaPoolAddress);
    const functionData = poolContract.interface.encodeFunctionData("setPoolParams", params);
    await (await gsFactory.connect(signer).execute(gammaPoolAddress, functionData)).wait(confirmations);
}

export async function addProtocol(signer: any, gsFactoryAddress: string, protocolAddress: string, protocolId: number, confirmations: number) {
    console.log(`adding protocol ${protocolAddress} to gsFactory at ${gsFactoryAddress}`)
    const gsFactory = await ethers.getContractAt("GammaPoolFactory", gsFactoryAddress)
    const _protocolAddress = await gsFactory.getProtocol(protocolId)
    if(_protocolAddress == ethers.constants.AddressZero) {
        const transactionResponse = await gsFactory.connect(signer).addProtocol(protocolAddress)
        await transactionResponse.wait(confirmations)
        console.log(`protocol ${protocolAddress} added to gsFactory`)
    } else {
        const transactionResponse = await gsFactory.connect(signer).updateProtocol(protocolId, protocolAddress)
        await transactionResponse.wait(confirmations)
        console.log(`protocolId ${protocolId} updated with implementation address ${_protocolAddress}`)
    }
}

export async function setIsProtocolRestricted(signer: any, gsFactoryAddress: string, isProtocolRestricted: boolean, protocolId: number, confirmations: number) {
    console.log(`${isProtocolRestricted ? '' : 'un'}restricting protocol ${protocolId} in gsFactory at ${gsFactoryAddress}`)
    const gsFactory = await ethers.getContractAt("GammaPoolFactory", gsFactoryAddress)
    const _protocolAddress = await gsFactory.getProtocol(protocolId)
    if(_protocolAddress==ethers.constants.AddressZero) {
        console.log(`protocol ${protocolId} does not exist`)
    } else {
        const transactionResponse = await gsFactory.connect(signer).setIsProtocolRestricted(protocolId, isProtocolRestricted)
        await transactionResponse.wait(confirmations)
        console.log(`protocol ${protocolId} is ${isProtocolRestricted ? '' : 'un'}restricted`)
    }
}

export function saveContractsAsJSON(contracts: any, fileName: string) {
    const contractsDir = path.join(__dirname, "/")

    console.log("contractsDir >> ", contractsDir)

    if (!fs.existsSync(contractsDir)) {
        console.log("")
        fs.mkdirSync(contractsDir)
    }

    const contractsAsString = JSON.stringify(contracts)

    console.log("contractsAsString >> ", contractsAsString)
    console.log("saving to >> ", path.join(contractsDir, fileName))
    fs.writeFile(path.join(contractsDir, fileName), contractsAsString, (err) => {
        if (err) console.log(err)
        else console.log("Saved contracts as JSON successfully.")
    })
}

export function getSushiHashCode(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return networkConfig[network.name].protocols?.sushiswap?.cfmmHash || "0xef6ec070bf409122f2104229fda397355457c9f7dec81971f5cccd2e45cb1eb4" // Sushi UniV2Pair init_code_hash
}

export function getUniV2HashCode(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return networkConfig[network.name].protocols?.uniswap?.cfmmHash || "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // UniV2Pair init_code_hash
}

export function getDeltaSwapHashCode(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return networkConfig[network.name].protocols?.deltaswap?.cfmmHash || "0xa82767a5e39a2e216962a2ebff796dcc37cd05dfd6f7a149e1f8fbb6bf487658" // DeltaSwapPair init_code_hash
}

export function getDeltaSwapV2HashCode(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return networkConfig[network.name].protocols?.deltaswapV2?.cfmmHash || "0xe115d9f0a810df66e5fc716c9e92dc1be3231a173421c53bb6d1b028eed8332f" // DeltaSwapPair init_code_hash
}

export function getDeltaSwapV2ProtocolId(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return Number(networkConfig[network.name].protocols?.deltaswapV2?.protocolid || 4)
}

export function getDeltaSwapProtocolId(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return Number(networkConfig[network.name].protocols?.deltaswap?.protocolid || 3)
}

export function getSushiSwapProtocolId(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return Number(networkConfig[network.name].protocols?.sushiswap?.protocolid || 2)
}

export function getUniV2ProtocolId(hre: HardhatRuntimeEnvironment) {
    const { network } = hre
    return Number(networkConfig[network.name].protocols?.uniswap?.protocolid || 1)
}

export function calcUniV2Address(factoryAddress: string, token0Addr: string, token1Addr: string, hashCode: string) {

    if(token0Addr === token1Addr) {
        return "0x";
    }

    if(BigNumber.from(token0Addr).gt(BigNumber.from(token1Addr))) {
        const tmp = token0Addr;
        token0Addr = token1Addr;
        token1Addr = tmp;
    }

    const salt = ethers.utils.solidityKeccak256(["address", "address"], [token0Addr, token1Addr]);

    // Or however you want to generate it
    return computeAddress(factoryAddress, salt, hashCode);
}

export function computeAddress(deployer: string, salt: any, hashCode: string) {

    // Compute the hash using Ethereum's CREATE2 rules
    const computedAddressHash = ethers.utils.keccak256(
        "0x" +
        [
            "ff",
            deployer,
            salt,
            hashCode
        ].map(x => x.replace(/0x/, ""))
            .join("")
    );

    // The computed address is the last 20 bytes of the computed hash
    const computedAddress = "0x" + computedAddressHash.substring(computedAddressHash.length - 40);

    return computedAddress;
}

export const getGammaPoolKey = (cfmmAddress: string, protocolId: number) => {
    const abi = ethers.utils.defaultAbiCoder;
    const data = abi.encode(
        ["address", "uint16"], // encode as address array
        [cfmmAddress, protocolId]
    );
    return ethers.utils.keccak256(data);
}

export const distributeTokens = async (tokenAddress: string, sender: any, contractName: string, receivers: string[], amount: BigNumber, confirmations: number) => {
    await mintTokens(contractName, tokenAddress, sender, sender.address, amount, confirmations)
    for(let i = 0; i < receivers.length; i++) {
        await mintTokens(contractName, tokenAddress, sender, receivers[i], amount, confirmations)
    }
}

export const mintTokens = async (contractName: string, tokenAddress: string, sender: any, receiver: string, quantity: BigNumber, confirmations: number) => {
    console.log(`minting of ${quantity.toString()} tokens to ${receiver}`)
    const erc20Token = await ethers.getContractAt(contractName, tokenAddress)
    const transactionResponse = await erc20Token.connect(sender).mint(receiver, quantity)
    await transactionResponse.wait(confirmations)
    console.log(`Balance of ${sender.address}: ${await erc20Token.balanceOf(sender.address)}`)
    console.log(`Balance of ${receiver}: ${await erc20Token.balanceOf(receiver)}`)
}

export const isMainnet = (hre: HardhatRuntimeEnvironment) => {
    return hre.network.name === "arbitrum" || hre.network.name == "mainnet" || hre.network.name == "base";
}