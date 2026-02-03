[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / createEthersHandleClient

# Function: createEthersHandleClient()

> **createEthersHandleClient**(`ethersClient`, `config?`): `Promise`\<[`HandleClient`](../interfaces/HandleClient.md)\>

Creates a [HandleClient](../interfaces/HandleClient.md) from an ethers signer provider

## Parameters

### ethersClient

[`EthersClient`](../type-aliases/EthersClient.md)

An ethers AbstractSigner instance connected to a Provider or a BrowserProvider instance

### config?

`Partial`\<[`HandleClientConfig`](../interfaces/HandleClientConfig.md)\>

Optional partial [HandleClientConfig](../interfaces/HandleClientConfig.md) to override network defaults

## Returns

`Promise`\<[`HandleClient`](../interfaces/HandleClient.md)\>

A Promise of [HandleClient](../interfaces/HandleClient.md) instance

## Throws

if the provided signer is invalid

## Throws

if the ethersClient fails to detect the connected chain or if the chain is not supported and no complete config is provided

## Examples

```ts
// BrowserProvider
import { BrowserProvider } from 'ethers';
import { createEthersHandleClient } from '@iexec-nox/handle';

const ethersClient = new BrowserProvider(window.ethereum);

const handleClient = createEthersHandleClient(ethersClient);
```

```ts
// Ethers Wallet
import { JsonRpcProvider, Wallet } from 'ethers';
import { createEthersHandleClient } from '@iexec-nox/handle';

const { RPC_URL, PRIVATE_KEY } = process.env;

const provider = new JsonRpcProvider(RPC_URL);
const ethersClient = new Wallet(PRIVATE_KEY, provider);

const handleClient = createEthersHandleClient(ethersClient);
```
