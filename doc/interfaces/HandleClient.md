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

***

### publicDecrypt()

> **publicDecrypt**\<`T`\>(`handle`): `Promise`\<\{ `decryptionProof`: `` `0x${string}` ``; `solidityType`: `T`; `value`: [`JsValue`](../type-aliases/JsValue.md)\<`T`\>; \}\>

Request the original value and a decryption proof associated with a publicly decryptable handle.

#### Type Parameters

##### T

`T` *extends* [`SolidityType`](../type-aliases/SolidityType.md)

#### Parameters

##### handle

[`Handle`](../type-aliases/Handle.md)\<`T`\>

The publicly decryptable handle representing the encrypted value

#### Returns

`Promise`\<\{ `decryptionProof`: `` `0x${string}` ``; `solidityType`: `T`; `value`: [`JsValue`](../type-aliases/JsValue.md)\<`T`\>; \}\>

The decrypted value, its [SolidityType](../type-aliases/SolidityType.md) and the decryptionProof

#### Remarks

To request public decryption, the handle must be publicly decryptable.
The decryption proof can be verified in a smart contract and used to produce a plaintext value onchain.

#### Example

```ts
const { value, solidityType, decryptionProof } = await client.publicDecrypt(handle);
```

***

### viewACL()

> **viewACL**(`handle`): `Promise`\<[`ACL`](../type-aliases/ACL.md)\>

View the Access Control List (ACL) for a handle.

#### Parameters

##### handle

[`Handle`](../type-aliases/Handle.md)\<[`SolidityType`](../type-aliases/SolidityType.md)\>

The handle representing the encrypted value

#### Returns

`Promise`\<[`ACL`](../type-aliases/ACL.md)\>

The [ACL](../type-aliases/ACL.md) details of the handle, including public access, admins, and viewers

#### Remarks

The ACL contains the following properties:
- `isPublic`: Indicates if the Handle is publicly decryptable (if `true`, anyone can decrypt it).
- `admins`: List of addresses that have admin permissions on the Handle.
- `viewers`: List of addresses that have viewer permissions on the Handle.

#### Example

```ts
const { isPublic, admins, viewers } = await client.viewACL(handle);
```
