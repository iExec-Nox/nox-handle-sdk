[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / Handle

# Type Alias: Handle\<T\>

> **Handle**\<`T`\> = `string` & `object`

Handle type representing an off-chain encrypted value manipulable on-chain.

The generic parameter T indicates the [SolidityType](SolidityType.md) of the represented value.

Handle format is checked at runtime. A handle must be a 32-byte hex string (`0x` + 64 hex chars).

## Type Declaration

### \_\_solidityType?

> `optional` **\_\_solidityType?**: `T`

## Type Parameters

### T

`T` *extends* [`SolidityType`](SolidityType.md)
