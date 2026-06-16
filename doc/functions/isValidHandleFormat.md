[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / isValidHandleFormat

# Function: isValidHandleFormat()

> **isValidHandleFormat**(`handle`): `` handle is `0x${string}` ``

Returns `true` if `handle` is a structurally valid Handle string, `false` otherwise.

Checks performed:

- format: `0x` + 64 hex characters (32 bytes)
- not the zero hash (uninitialized handle)
- known attribute byte (0 or 1)
- known Solidity type code (byte 5)
- supported version byte (byte 0)

## Parameters

### handle

`unknown`

The value to check.

## Returns

`` handle is `0x${string}` ``

`true` if the handle passes all structural checks, `false` otherwise.

## Example

```ts
import { isValidHandleFormat } from '@iexec-nox/handle';

if (isValidHandleFormat(someValue)) {
  // someValue is narrowed to HexString here
}
```
