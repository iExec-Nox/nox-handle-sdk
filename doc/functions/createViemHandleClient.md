[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / createViemHandleClient

# Function: createViemHandleClient()

> **createViemHandleClient**(`viemClient`, `config?`): `Promise`\<[`HandleClient`](../interfaces/HandleClient.md)\>

Creates a [HandleClient](../interfaces/HandleClient.md) from a viem WalletClient

## Parameters

### viemClient

A viem WalletClient instance connected to an account

`SmartAccount` | \{ \}

### config?

`Partial`\<[`HandleClientConfig`](../interfaces/HandleClientConfig.md)\>

Optional partial [HandleClientConfig](../interfaces/HandleClientConfig.md) to override network defaults

## Returns

`Promise`\<[`HandleClient`](../interfaces/HandleClient.md)\>

A Promise of [HandleClient](../interfaces/HandleClient.md) instance

## Throws

if the provided viemClient is invalid

## Throws

if the viemClient fails to detect the connected chain or if the chain is not supported and no complete config is provided

## Examples

```ts
// JSON-RPC Account
import { createWalletClient, custom } from 'viem'

const viemClient = createWalletClient({
  transport: custom(window.ethereum)
})

const handleClient = createViemHandleClient(viemClient);
```

```ts
// Local Account
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { createViemHandleClient } from "@iexec-nox/handle";

const { RPC_URL, PRIVATE_KEY } = process.env;

const viemClient = createWalletClient({
  account: privateKeyToAccount(PRIVATE_KEY),
  transport: http(RPC_URL),
});

const handleClient = createViemHandleClient(viemClient);
```
