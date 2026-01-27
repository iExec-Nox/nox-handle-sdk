# nox-handle-sdk

A TypeScript SDK for encrypting, decrypting, and managing confidential values on blockchain using Handles. Works with both ethers and viem.

Handles are 32-byte identifiers that reference encrypted values stored off-chain, enabling privacy-preserving smart contract interactions.

## Installation

```bash
npm install nox-handle-sdk
```

## Quick Start

### With Ethers

```typescript
import { createEthersHandleClient } from 'nox-handle-sdk';
import { Wallet } from 'ethers';

const signer = new Wallet(privateKey, provider);
const handleClient = await createEthersHandleClient(signer);

// Encrypt a value
const { handle, inputProof } = await handleClient.encryptInput(
  100_000_000n,
  'uint256'
);

// Use handle and inputProof in your smart contract call
await myContract.deposit(handle, inputProof);
```

### With Viem

```typescript
import { createViemHandleClient } from 'nox-handle-sdk';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const walletClient = createWalletClient({
  chain: mainnet,
  transport: http(),
  account: privateKeyToAccount(privateKey),
});

const handleClient = await createViemHandleClient(walletClient);

// Encrypt a value
const { handle, inputProof } = await handleClient.encryptInput(true, 'bool');

// Use handle and inputProof in your smart contract call
await myContract.isAllowed(handle, inputProof);
```

## Architecture

The SDK provides a unified `HandleClient` that abstracts blockchain interactions through adapters for ethers and viem. It communicates with an off-chain gateway to manage encrypted values while remaining agnostic to specific smart contract implementations.

**Core components:**

- **HandleClient**: Entry point to work with handles, exposing `encryptInput` and `decrypt` methods
- **Blockchain adapters**: Handle wallet signing and chain interactions for ethers or viem
- **Gateway API**: Manages encryption, storage, and retrieval of confidential values

## Core API

### encryptInput

Encrypts a value and returns a handle for use in smart contracts.

```typescript
const { handle, inputProof } = await handleClient.encryptInput(
  value,
  solidityType
);
```

**Parameters:**

| Parameter      | Type                          | Description                                                     |
| -------------- | ----------------------------- | --------------------------------------------------------------- |
| `value`        | `boolean \| string \| bigint` | The value to encrypt                                            |
| `solidityType` | `SolidityType`                | Target Solidity type (e.g., `"uint256"`, `"bool"`, `"address"`) |

**Returns:** `{ handle: string, inputProof: string }`

- `handle`: bytes32 - reference to the encrypted value
- `inputProof`: bytes - input type proof verifiable by the smart contract

**Security:** Plaintext input is transmitted to the trusted Gateway for encryption over a secure TLS connection.

**Examples:**

```typescript
// Encrypt an unsigned integer
const { handle, inputProof } = await handleClient.encryptInput(
  1000n,
  'uint256'
);

// Encrypt a boolean
const { handle, inputProof } = await handleClient.encryptInput(true, 'bool');

// Encrypt an address
const { handle, inputProof } = await handleClient.encryptInput(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
  'address'
);

// Encrypt fixed-size bytes
const { handle, inputProof } = await handleClient.encryptInput(
  '0xdeadbeef',
  'bytes4'
);
```

### decrypt

Decrypts a handle for an allowed user and returns the original value. Requires an EIP-712 signature.

```typescript
const { value, solidityType } = await handleClient.decrypt(handle);
```

**Parameters:**

| Parameter | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| `handle`  | `string` | The handle (bytes32) to decrypt |

**Returns:** `{  value: JsValue<T>; solidityType: T extends SolidityType }`

- `value`: The decrypted value cast in the JS type (`boolean`|`bigint`|`string`) corresponding to the Solidity type
- `solidityType`: The Solidity type of the value

**Security:** Requires a gasless EIP-712 signature from the authorized user. Uses ECIES with a shared secret encrypted with the user's ephemeral RSA public key to guarantee only the authorized user can decrypt the data.

**Example:**

```typescript
const { value, solidityType } = await handleClient.decrypt(
  '0x7a3b9c8d2e1f0a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'
);
```

## Types

### SolidityType

All supported Solidity types for encryption:

```typescript
type SolidityType =
  // Special types
  | 'bool'
  | 'address'
  | 'bytes'
  | 'string'
  // Unsigned integers (uint8 to uint256, step 8)
  | 'uint8'
  | 'uint16'
  | 'uint24'
  | 'uint32'
  | 'uint40'
  | 'uint48'
  | 'uint56'
  | 'uint64'
  | 'uint72'
  | 'uint80'
  | 'uint88'
  | 'uint96'
  | 'uint104'
  | 'uint112'
  | 'uint120'
  | 'uint128'
  | 'uint136'
  | 'uint144'
  | 'uint152'
  | 'uint160'
  | 'uint168'
  | 'uint176'
  | 'uint184'
  | 'uint192'
  | 'uint200'
  | 'uint208'
  | 'uint216'
  | 'uint224'
  | 'uint232'
  | 'uint240'
  | 'uint248'
  | 'uint256'
  // Signed integers (int8 to int256, step 8)
  | 'int8'
  | 'int16'
  | 'int24'
  | 'int32'
  | 'int40'
  | 'int48'
  | 'int56'
  | 'int64'
  | 'int72'
  | 'int80'
  | 'int88'
  | 'int96'
  | 'int104'
  | 'int112'
  | 'int120'
  | 'int128'
  | 'int136'
  | 'int144'
  | 'int152'
  | 'int160'
  | 'int168'
  | 'int176'
  | 'int184'
  | 'int192'
  | 'int200'
  | 'int208'
  | 'int216'
  | 'int224'
  | 'int232'
  | 'int240'
  | 'int248'
  | 'int256'
  // Fixed-size bytes (bytes1 to bytes32)
  | 'bytes1'
  | 'bytes2'
  | 'bytes3'
  | 'bytes4'
  | 'bytes5'
  | 'bytes6'
  | 'bytes7'
  | 'bytes8'
  | 'bytes9'
  | 'bytes10'
  | 'bytes11'
  | 'bytes12'
  | 'bytes13'
  | 'bytes14'
  | 'bytes15'
  | 'bytes16'
  | 'bytes17'
  | 'bytes18'
  | 'bytes19'
  | 'bytes20'
  | 'bytes21'
  | 'bytes22'
  | 'bytes23'
  | 'bytes24'
  | 'bytes25'
  | 'bytes26'
  | 'bytes27'
  | 'bytes28'
  | 'bytes29'
  | 'bytes30'
  | 'bytes31'
  | 'bytes32';
```

### Config

Optional configuration for custom deployments:

```typescript
type Config = {
  gatewayUrl: string; // Gateway API endpoint
  smartContractAddress: string; // Protocol contract address
};
```

## Security & Signatures

| Method         | Signature Required   | Protocol      |
| -------------- | -------------------- | ------------- |
| `encryptInput` | None                 | TLS           |
| `decrypt`      | 1x EIP-712 (gasless) | Re-encryption |

- **encryptInput**: Values are encrypted client-side and transmitted over TLS. No on-chain transaction or signature required.
- **decrypt**: Requires a gasless EIP-712 signature to prove ownership. The gateway re-encrypts the value for the requester.

## Status & Limitations

This library is still under development, and interfaces may slightly change in the next versions.
