<p align="center"><a href="https://gammaswap.com" target="_blank" rel="noopener noreferrer"><img width="100" src="https://app.gammaswap.com/logo.svg" alt="Gammaswap logo"></a></p>

<p align="center">
  <a href="https://github.com/gammaswap/gs-token/actions/workflows/pr.yml">
    <img src="https://github.com/gammaswap/gs-token/actions/workflows/main.yml/badge.svg?branch=main" alt="Compile/Test/Publish">
  </a>
</p>

<h1 align="center">V1-Deployment</h1>

## Description
GammaSwap token used to secure liquidation and rebalancing logic in exchange for protocol fees

# Deployment Steps

1. Run 01-deploy-gs-token.ts in every chain (No need to set up mintGSTokenTo or initialGSTokenAmt unless it's first deployment)
2. Set addresses of GS Token deployed in every chain in helper-hardhat-config.ts in erc20Tokens section in networkConfigInfo
3. Add the chain name to developmentLzPeers and productionLzPeers in helper-hardhat-config.ts
4. Run 02-deploy-set-lzpeers.ts to connect every token to every token in every chain where it is deployed.
   If it's the first deployment, it must be run for every chain. Otherwise only run for the new GS token chain.
5. Set minDelay to short time period and add proposers and executors to timelock section of chain networkConfig in helper-hardhat-config.ts
6. Run 03-deploy-timelock-controller.ts to transfer ownership of the GS Token to the timelock controller
7. Transfer GS Token ownership to timelock-controller
8. Run 07-update-enforced-options.ts on all chains to set the enforced options from all peers to all peers.
   This is using the timelock-controller, so it only needs to be set for the new chain. This step should only end up setting
   the enforced options for the new chain and all existing chains to the new chain.
9. Run 08-deploy-timelock-set-lzpeers.ts to set LZ peers of chains already owned by timelock for the new chain. This step
   is done after step 8, to make sure that there are already enforced options. No need to perform this step if this was the
    first deployment of GS token.
10. Run 06-update-timelock-delay, to set the timelock on the new chain to
