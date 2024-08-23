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

1. Run 01-deploy-gs-token.ts in every chain
2. Set addresses of GS Token deployed in every chain in helper-hardhat-config.ts in erc20Tokens section in networkConfigInfo
3. Run 02-deploy-set-lzpeers.ts to connect every token to every token in every chain where it is deployed
4. Run 03-deploy-timelock-controller.ts to transfer ownership of the GS Token to the timelock controller