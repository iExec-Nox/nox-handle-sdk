import { expectTypeOf } from 'vitest';
import type {
  Handle,
  HandleClient,
  HexString,
  SolidityType,
} from '../../src/index.js';

const handleClient = {} as HandleClient;
const CONTRACT: HexString = '0x1234567890123456789012345678901234567890';

// encryptInput returns Handle<T>
expectTypeOf(
  handleClient.encryptInput(true, 'bool', CONTRACT)
).resolves.toEqualTypeOf<{
  handle: Handle<'bool'>;
  handleProof: HexString;
}>();

expectTypeOf(
  handleClient.encryptInput(
    '0x1234567890123456789012345678901234567890',
    'address',
    CONTRACT
  )
).resolves.toEqualTypeOf<{
  handle: Handle<'address'>;
  handleProof: HexString;
}>();

expectTypeOf(
  handleClient.encryptInput(123n, 'uint256', CONTRACT)
).resolves.toEqualTypeOf<{
  handle: Handle<'uint256'>;
  handleProof: HexString;
}>();

expectTypeOf(
  handleClient.encryptInput(-123n, 'int256', CONTRACT)
).resolves.toEqualTypeOf<{
  handle: Handle<'int256'>;
  handleProof: HexString;
}>();

// decrypt infers value type from Handle<T>
expectTypeOf(
  handleClient.decrypt('handle' as Handle<'bool'>)
).resolves.toEqualTypeOf<{ value: boolean; solidityType: 'bool' }>();

expectTypeOf(
  handleClient.decrypt('handle' as Handle<'address'>)
).resolves.toEqualTypeOf<{ value: string; solidityType: 'address' }>();

expectTypeOf(
  handleClient.decrypt('handle' as Handle<'uint256'>)
).resolves.toEqualTypeOf<{ value: bigint; solidityType: 'uint256' }>();

expectTypeOf(
  handleClient.decrypt('handle' as Handle<'int256'>)
).resolves.toEqualTypeOf<{ value: bigint; solidityType: 'int256' }>();

// untyped string → value is union of all possible types
expectTypeOf(handleClient.decrypt('handle')).resolves.toEqualTypeOf<{
  value: boolean | string | bigint;
  solidityType: SolidityType;
}>();

// publicDecrypt infers value type from Handle<T>
expectTypeOf(
  handleClient.publicDecrypt('handle' as Handle<'bool'>)
).resolves.toEqualTypeOf<{
  value: boolean;
  solidityType: 'bool';
  decryptionProof: HexString;
}>();

expectTypeOf(
  handleClient.publicDecrypt('handle' as Handle<'address'>)
).resolves.toEqualTypeOf<{
  value: string;
  solidityType: 'address';
  decryptionProof: HexString;
}>();

expectTypeOf(
  handleClient.publicDecrypt('handle' as Handle<'uint256'>)
).resolves.toEqualTypeOf<{
  value: bigint;
  solidityType: 'uint256';
  decryptionProof: HexString;
}>();

expectTypeOf(
  handleClient.publicDecrypt('handle' as Handle<'int256'>)
).resolves.toEqualTypeOf<{
  value: bigint;
  solidityType: 'int256';
  decryptionProof: HexString;
}>();

// untyped string → value is union of all possible types
expectTypeOf(handleClient.publicDecrypt('handle')).resolves.toEqualTypeOf<{
  value: boolean | string | bigint;
  solidityType: SolidityType;
  decryptionProof: HexString;
}>();

// viewACL
expectTypeOf(handleClient.viewACL('handle')).resolves.toEqualTypeOf<{
  isPublic: boolean;
  admins: string[];
  viewers: string[];
}>();
