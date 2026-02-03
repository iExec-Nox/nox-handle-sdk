[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / createHandleClient

# Function: createHandleClient()

> **createHandleClient**(`blockchainClient`, `config?`): `Promise`\<[`HandleClient`](../interfaces/HandleClient.md)\>

Creates a [HandleClient](../interfaces/HandleClient.md) from a client of either ethers or viem

## Parameters

### blockchainClient

[`BlockchainClient`](../type-aliases/BlockchainClient.md)

An ethers client with a Signer and a Provider or a viem WalletClient connected to an account

### config?

`Partial`\<[`HandleClientConfig`](../interfaces/HandleClientConfig.md)\>

Optional partial [HandleClientConfig](../interfaces/HandleClientConfig.md) to override network defaults

## Returns

`Promise`\<[`HandleClient`](../interfaces/HandleClient.md)\>

A Promise of [HandleClient](../interfaces/HandleClient.md) instance

## Throws

if the provided blockchainClient is invalid

## Throws

if the blockchainClient fails to detect the connected chain or if the chain is not supported and no complete config is provided

## Remarks

This function is provided for convenience, you should use [createEthersHandleClient](createEthersHandleClient.md)
or [createViemHandleClient](createViemHandleClient.md) for smaller bundle size.

## Examples

```ts
// Ethers BrowserProvider
import { BrowserProvider } from 'ethers';
import { createHandleClient } from '@iexec-nox/handle';

const ethersClient = new BrowserProvider(window.ethereum);

const handleClient = createHandleClient(ethersClient);
```

```ts
// Viem JSON-RPC Account
import { createWalletClient, custom } from 'viem'
import { createHandleClient } from '@iexec-nox/handle';

const viemClient = createWalletClient({
  transport: custom(window.ethereum)
})

const handleClient = createHandleClient(viemClient);
```
