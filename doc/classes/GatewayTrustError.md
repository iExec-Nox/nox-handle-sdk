[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / GatewayTrustError

# Class: GatewayTrustError

Custom error class for gateway server verification failures.
This error is thrown when the gateway response fails signature verification, indicating a potential tampering of the response.

## Extends

- `Error`

## Constructors

### Constructor

> **new GatewayTrustError**(`message`, `options?`): `GatewayTrustError`

#### Parameters

##### message

`string`

##### options?

`ErrorOptions`

#### Returns

`GatewayTrustError`

#### Overrides

`Error.constructor`
