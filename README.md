![CI](../../actions/workflows/ci.yml/badge.svg)

# MultiSig Wallet (2-of-3)

A minimal Ethereum multisignature wallet implemented in Solidity.
Owners can submit a transaction, confirm it on-chain, and execute it once the required number of confirmations is reached.

## Features
- 2-of-3 confirmations (configurable in constructor)
- Submit / confirm / revoke / execute flow
- Events for all key actions (Deposit, Submit, Confirm, Revoke, Execute)
- Full unit test coverage (Hardhat + ethers v6)

## Contracts
- `contracts/MultiSigWallet.sol`

## Run locally
```bash
npm install
npx hardhat test
