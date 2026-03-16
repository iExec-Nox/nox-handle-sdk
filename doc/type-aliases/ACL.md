[**@iexec-nox/handle**](../README.md)

***

[@iexec-nox/handle](../README.md) / ACL

# Type Alias: ACL

> **ACL** = `object`

Access Control List (ACL) for a Handle, including public access, admins, and viewers.

The ACL contains the following properties:
- `isPublic`: Indicates if the Handle is publicly decryptable (if `true`, anyone can decrypt it).
- `admins`: List of addresses that have admin permissions on the Handle.
- `viewers`: List of addresses that have viewer permissions on the Handle.

## Properties

### admins

> **admins**: `string`[]

***

### isPublic

> **isPublic**: `boolean`

***

### viewers

> **viewers**: `string`[]
