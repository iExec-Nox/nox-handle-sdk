[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / HandleClient

# Interface: HandleClient

A client to interact with encrypted values using Handles on blockchain

## Methods

### decrypt()

> **decrypt**\<`T`\>(`handle`): `Promise`\<\{ `solidityType`: `T`; `value`: [`JsValue`](../type-aliases/JsValue.md)\<`T`\>; \}\>

Request the original value associated with a handle.

#### Type Parameters

##### T

`T` *extends* [`SolidityType`](../type-aliases/SolidityType.md)

#### Parameters

##### handle

[`Handle`](../type-aliases/Handle.md)\<`T`\>

The handle representing the encrypted value

#### Returns

`Promise`\<\{ `solidityType`: `T`; `value`: [`JsValue`](../type-aliases/JsValue.md)\<`T`\>; \}\>

The decrypted value and its [SolidityType](../type-aliases/SolidityType.md)

#### Remarks

The decryption key is shared with the connected wallet address via public key encryption.
To request decryption, the connected wallet must be allowed to view the data and provide an EIP712 DataAccessAuthorization signature.

#### Example

```ts
const { value, solidityType } = await client.decrypt(handle);
```

***

### encryptInput()

> **encryptInput**\<`T`\>(`value`, `solidityType`, `applicationContract`): `Promise`\<\{ `handle`: [`Handle`](../type-aliases/Handle.md)\<`T`\>; `handleProof`: `` `0x${string}` ``; \}\>

Encrypts a value and returns a handle for use in smart contracts.

#### Type Parameters

##### T

`T` *extends* [`SolidityType`](../type-aliases/SolidityType.md)

#### Parameters

##### value

[`JsValue`](../type-aliases/JsValue.md)\<`T`\>

The value to encrypt (boolean, string, or bigint)

##### solidityType

`T`

The [SolidityType](../type-aliases/SolidityType.md) of the value

##### applicationContract

`` `0x${string}` ``

The address of the contract allowed to use the input

#### Returns

`Promise`\<\{ `handle`: [`Handle`](../type-aliases/Handle.md)\<`T`\>; `handleProof`: `` `0x${string}` ``; \}\>

[Handle](../type-aliases/Handle.md) and handleProof for smart contract usage

#### Example

```ts
// Encrypt a uint256
const { handle, handleProof } = await client.encryptInput(
  1000000n,
  'uint256',
  '0x123...abc'
);

// Encrypt a boolean
const { handle, handleProof } = await client.encryptInput(
  true,
  'bool',
  '0x123...abc'
);
```
