[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / HandleProof

# Type Alias: HandleProof

> **HandleProof** = [`HexString`](HexString.md) & `object`

Branded type for a handle proof returned by the Handle Gateway.
It is an opaque hex string (`0x` + 274 hex characters, 137 bytes) that proves
the encryption was performed correctly and can be submitted on-chain.

Returned by [`encryptInput`](../interfaces/HandleClient.md) alongside the [`Handle`](Handle.md).

## Type Declaration

### \_\_brand

> **\_\_brand**: `"HandleProof"`
