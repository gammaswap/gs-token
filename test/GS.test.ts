import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, Contract, ContractFactory } from 'ethers';
import { GS, GS__factory } from '../typechain-types'

import { Options } from '@layerzerolabs/lz-v2-utilities';

describe.only('GS Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    // Declaration of variables to be used in the test suite
    let GS: GS__factory;
    let EndpointV2Mock: ContractFactory;
    let ownerA: SignerWithAddress;
    let ownerB: SignerWithAddress;
    let endpointOwner: SignerWithAddress;
    let srcGovToken: GS;
    let dstGovToken: GS;
    let mockEndpointA: Contract;
    let mockEndpointB: Contract;

    const srcChainId = 1
    const dstChainId = 2
    const globalSupply = ethers.utils.parseUnits("1600000000", 18)

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
        const signers = await ethers.getSigners();
        // Contract factory for our tested contract
        GS = await ethers.getContractFactory('GS') as GS__factory;
        EndpointV2Mock = await ethers.getContractFactory('EndpointV2Mock');

        ownerA = signers.at(0)!;
        ownerB = signers.at(1)!;
        endpointOwner = signers.at(2)!;
    });

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpointA = await EndpointV2Mock.deploy(srcChainId);
        mockEndpointB = await EndpointV2Mock.deploy(dstChainId);

        // Deploying two instances of GS contract with different identifiers and linking them to the mock LZEndpoint
        srcGovToken = await GS.deploy(mockEndpointA.address, ownerA.address, globalSupply) as GS;
        dstGovToken = await GS.deploy(mockEndpointB.address, ownerB.address, ethers.constants.Zero) as GS;

        // Setting destination endpoints in the LZEndpoint mock for each GS instance
        await mockEndpointA.setDestLzEndpoint(dstGovToken.address, mockEndpointB.address);
        await mockEndpointB.setDestLzEndpoint(srcGovToken.address, mockEndpointA.address);

        // Setting each GS instance as a peer of the other in the mock LZEndpoint
        await srcGovToken.connect(ownerA).setPeer(dstChainId, ethers.utils.zeroPad(dstGovToken.address, 32));
        await dstGovToken.connect(ownerB).setPeer(srcChainId, ethers.utils.zeroPad(srcGovToken.address, 32));

        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

        const srcEnforcedOptionParams = [{
            eid: srcChainId,
            msgType: 1, // 1: SEND, 2: SEND_AND_CALL
            options: options
        }];
        await srcGovToken.connect(ownerA).setEnforcedOptions(srcEnforcedOptionParams);

        const dstEnforcedOptionParams = [{
            eid: dstChainId,
            msgType: 1, // 1: SEND, 2: SEND_AND_CALL
            options: options
        }];
        await dstGovToken.connect(ownerB).setEnforcedOptions(dstEnforcedOptionParams);
    });

    describe("deployment", async () => {
        it("init values", async () => {
            expect(await srcGovToken.name()).to.equal("GammaSwap")
            expect(await srcGovToken.symbol()).to.equal("GS")

            const totalSupply = await srcGovToken.totalSupply();

            expect(totalSupply).to.equal(globalSupply)
            expect(await srcGovToken.totalSupply()).to.equal(totalSupply)
            expect(await srcGovToken.totalSupply()).to.equal(totalSupply)
        })

        it("Deployer owns everything", async () => {
            const totalSupply = await srcGovToken.totalSupply();
            expect(await srcGovToken.balanceOf(ownerA.address)).to.equal(totalSupply)
        })

        it("Check Peers", async () => {
            expect(await srcGovToken.isPeer(dstChainId, ethers.utils.zeroPad(dstGovToken.address, 32))).to.be.true
            expect(await dstGovToken.isPeer(srcChainId, ethers.utils.zeroPad(srcGovToken.address, 32))).to.be.true
        })
    })

    describe("crosses", async () => {
        // A test case to verify token transfer functionality
        it('should send a token from A address to B address via each OFT', async function () {
            // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
            const initialAmount = await srcGovToken.balanceOf(ownerA.address) as BigNumber;

            // Defining the amount of tokens to send and constructing the parameters for the send operation
            const tokensToSend = ethers.utils.parseEther('1');

            // Defining extra message execution options for the send operation
            const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

            const sendParam = {
                dstEid: dstChainId, // Destination endpoint ID.
                to: ethers.utils.zeroPad(ownerB.address, 32), // Recipient address.
                amountLD: tokensToSend, // Amount to send in local decimals.
                minAmountLD: tokensToSend, // Minimum amount to send in local decimals.
                extraOptions: options, // Additional options supplied by the caller to be used in the LayerZero message.
                composeMsg: "0x", // The composed message for the send() operation.
                oftCmd: "0x" // The OFT command to be executed, unused in default OFT implementations.
            }

            // Fetching the native fee for the token send operation (nativeFee, lzTokenFee)
            let [nativeFee, lzTokenFee] = await srcGovToken.quoteSend(sendParam, false);

            expect(nativeFee).to.gt(0);
            expect(lzTokenFee).to.equal(0);// we requested this to be zero with _payInLzToken: false

            const messagingFee = {
                nativeFee: nativeFee,
                lzTokenFee: lzTokenFee
            }

            // Executing the send operation from srcGov contract
            let refundAddress = ownerA.address;
            await srcGovToken.send(sendParam, messagingFee, refundAddress,
                {value: messagingFee.nativeFee} // pass a msg.value to pay the LayerZero message fee
            );

            // Fetching the final token balances of ownerA and ownerB
            let finalBalanceA = await srcGovToken.balanceOf(ownerA.address) as BigNumber;
            let finalBalanceB = await dstGovToken.balanceOf(ownerB.address) as BigNumber;

            // Asserting that the final balances are as expected after the send operation
            expect(finalBalanceA.eq(initialAmount.sub(tokensToSend))).to.be.true;
            expect(finalBalanceB.eq(tokensToSend)).to.be.true;


            sendParam.dstEid = srcChainId;
            sendParam.to = ethers.utils.zeroPad(ownerA.address, 32);

            // Fetching the native fee for the token send operation (nativeFee, lzTokenFee)
            [nativeFee, lzTokenFee] = await dstGovToken.quoteSend(sendParam, false);

            expect(nativeFee).to.gt(0);
            expect(lzTokenFee).to.equal(0);// we requested this to be zero with _payInLzToken: false

            messagingFee.nativeFee = nativeFee
            messagingFee.lzTokenFee = lzTokenFee

            // Executing the send operation from dstGov contract
            refundAddress = ownerB.address;
            await dstGovToken.connect(ownerB).send(sendParam, messagingFee, refundAddress,
                {value: messagingFee.nativeFee} // pass a msg.value to pay the LayerZero message fee
            );

            // Fetching the final token balances of ownerA and ownerB
            finalBalanceA = await srcGovToken.balanceOf(ownerA.address) as BigNumber;
            finalBalanceB = await dstGovToken.balanceOf(ownerB.address) as BigNumber;

            // Asserting that the final balances are as expected after the send operation
            expect(finalBalanceA.eq(initialAmount)).to.be.true;
            expect(finalBalanceB.eq(0)).to.be.true;
        });
    });
});