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

`T` *extends* `"string"` \| `"bool"` \| `"address"` \| `"bytes"` \| `"uint8"` \| `"uint16"` \| `"uint24"` \| `"uint32"` \| `"uint40"` \| `"uint48"` \| `"uint56"` \| `"uint64"` \| `"uint72"` \| `"uint80"` \| `"uint88"` \| `"uint96"` \| `"uint104"` \| `"uint112"` \| `"uint120"` \| `"uint128"` \| `"uint136"` \| `"uint144"` \| `"uint152"` \| `"uint160"` \| `"uint168"` \| `"uint176"` \| `"uint184"` \| `"uint192"` \| `"uint200"` \| `"uint208"` \| `"uint216"` \| `"uint224"` \| `"uint232"` \| `"uint240"` \| `"uint248"` \| `"uint256"` \| `"int8"` \| `"int16"` \| `"int24"` \| `"int32"` \| `"int40"` \| `"int48"` \| `"int56"` \| `"int64"` \| `"int72"` \| `"int80"` \| `"int88"` \| `"int96"` \| `"int104"` \| `"int112"` \| `"int120"` \| `"int128"` \| `"int136"` \| `"int144"` \| `"int152"` \| `"int160"` \| `"int168"` \| `"int176"` \| `"int184"` \| `"int192"` \| `"int200"` \| `"int208"` \| `"int216"` \| `"int224"` \| `"int232"` \| `"int240"` \| `"int248"` \| `"int256"` \| `"bytes1"` \| `"bytes2"` \| `"bytes3"` \| `"bytes4"` \| `"bytes5"` \| `"bytes6"` \| `"bytes7"` \| `"bytes8"` \| `"bytes9"` \| `"bytes10"` \| `"bytes11"` \| `"bytes12"` \| `"bytes13"` \| `"bytes14"` \| `"bytes15"` \| `"bytes16"` \| `"bytes17"` \| `"bytes18"` \| `"bytes19"` \| `"bytes20"` \| `"bytes21"` \| `"bytes22"` \| `"bytes23"` \| `"bytes24"` \| `"bytes25"` \| `"bytes26"` \| `"bytes27"` \| `"bytes28"` \| `"bytes29"` \| `"bytes30"` \| `"bytes31"` \| `"bytes32"`

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

`T` *extends* `"string"` \| `"bool"` \| `"address"` \| `"bytes"` \| `"uint8"` \| `"uint16"` \| `"uint24"` \| `"uint32"` \| `"uint40"` \| `"uint48"` \| `"uint56"` \| `"uint64"` \| `"uint72"` \| `"uint80"` \| `"uint88"` \| `"uint96"` \| `"uint104"` \| `"uint112"` \| `"uint120"` \| `"uint128"` \| `"uint136"` \| `"uint144"` \| `"uint152"` \| `"uint160"` \| `"uint168"` \| `"uint176"` \| `"uint184"` \| `"uint192"` \| `"uint200"` \| `"uint208"` \| `"uint216"` \| `"uint224"` \| `"uint232"` \| `"uint240"` \| `"uint248"` \| `"uint256"` \| `"int8"` \| `"int16"` \| `"int24"` \| `"int32"` \| `"int40"` \| `"int48"` \| `"int56"` \| `"int64"` \| `"int72"` \| `"int80"` \| `"int88"` \| `"int96"` \| `"int104"` \| `"int112"` \| `"int120"` \| `"int128"` \| `"int136"` \| `"int144"` \| `"int152"` \| `"int160"` \| `"int168"` \| `"int176"` \| `"int184"` \| `"int192"` \| `"int200"` \| `"int208"` \| `"int216"` \| `"int224"` \| `"int232"` \| `"int240"` \| `"int248"` \| `"int256"` \| `"bytes1"` \| `"bytes2"` \| `"bytes3"` \| `"bytes4"` \| `"bytes5"` \| `"bytes6"` \| `"bytes7"` \| `"bytes8"` \| `"bytes9"` \| `"bytes10"` \| `"bytes11"` \| `"bytes12"` \| `"bytes13"` \| `"bytes14"` \| `"bytes15"` \| `"bytes16"` \| `"bytes17"` \| `"bytes18"` \| `"bytes19"` \| `"bytes20"` \| `"bytes21"` \| `"bytes22"` \| `"bytes23"` \| `"bytes24"` \| `"bytes25"` \| `"bytes26"` \| `"bytes27"` \| `"bytes28"` \| `"bytes29"` \| `"bytes30"` \| `"bytes31"` \| `"bytes32"`

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
