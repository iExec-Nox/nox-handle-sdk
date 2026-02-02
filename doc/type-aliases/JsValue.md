[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / JsValue

# Type Alias: JsValue\<T\>

> **JsValue**\<`T`\> = `BoolLike`\<`T`\> \| `StringLike`\<`T`\> \| `BigIntLike`\<`T`\>

Value types associated to Solidity type:
- bool → boolean
- string → string
- address, bytes, bytes* → string (hex)
- uint*, int* → bigint

## Type Parameters

### T

`T` *extends* [`SolidityType`](SolidityType.md)
