[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / JsValue

# Type Alias: JsValue\<T\>

> **JsValue**\<`T`\> = `T` *extends* `"bool"` ? `boolean` : `T` *extends* `"string"` \| `"address"` \| `"bytes"` \| `` `bytes${number}` `` ? `string` : `T` *extends* `` `uint${number}` `` \| `` `int${number}` `` ? `bigint` : `never`

Value types associated to Solidity type:
- bool → boolean
- string → string
- address, bytes, bytes* → string (hex)
- uint*, int* → bigint

## Type Parameters

### T

`T` *extends* [`SolidityType`](SolidityType.md)
