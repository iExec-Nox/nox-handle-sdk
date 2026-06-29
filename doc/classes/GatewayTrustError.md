[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / GatewayTrustError

# Class: GatewayTrustError

Custom error class for gateway trust / attestation failures.

This error is thrown when the SDK detects that a gateway response cannot be trusted (e.g. signature verification fails, or the response handle does not match the requested handle).

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
