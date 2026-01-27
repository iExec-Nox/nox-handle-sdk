/* eslint-disable unicorn/numeric-separators-style */
import { describe, it, expect } from 'vitest';
import {
  isBaseURL,
  isEthereumAddress,
  validateHandle,
  validateHandleProof,
} from '../../../src/utils/validators.js';
import { SOLIDITY_TYPE_TO_CODE } from '../../../src/utils/types.js';
import {
  buildHandle,
  buildHandleProof,
  timestampToHex,
} from '../../helpers/mocks.js';

describe('isBaseURL', () => {
  const validUrls = [
    'http://example.com',
    'https://example.com',
    'https://api.example.com',
    'http://localhost',
    'https://gateway.testnet.nox.com',
    'https://example.com/',
  ];

  for (const url of validUrls) {
    it(`should return true for valid URL: ${url}`, () => {
      expect(isBaseURL(url)).toBe(true);
    });
  }

  const invalidUrls = [
    'not-a-url',
    'ftp://example.com',
    'https://example.com/path',
    'https://example.com?query=1',
    'https://example.com/path?query=1',
    '',
    123,
    undefined,
  ];

  for (const url of invalidUrls) {
    it(`should return false for invalid URL: ${String(url)}`, () => {
      expect(isBaseURL(url)).toBe(false);
    });
  }
});

describe('isEthereumAddress', () => {
  const validAddresses = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdef1234567890abcdef1234567890abcdef12',
    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  ];

  for (const address of validAddresses) {
    it(`should return true for valid address: ${address}`, () => {
      expect(isEthereumAddress(address)).toBe(true);
    });
  }

  const invalidAddresses = [
    '0x1234',
    '0x123456789012345678901234567890123456789',
    '0x12345678901234567890123456789012345678901',
    '1234567890123456789012345678901234567890',
    '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    '',
    123,
    undefined,
  ];

  for (const address of invalidAddresses) {
    it(`should return false for invalid address: ${String(address)}`, () => {
      expect(isEthereumAddress(address)).toBe(false);
    });
  }
});

describe('validateHandle', () => {
  describe('format validation', () => {
    it('accepts valid 32-byte handle', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    it('should reject handle with wrong length', () => {
      expect(() =>
        validateHandle({
          handle: '0x1234',
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Invalid handle format: expected 0x + 64 hex chars (32 bytes)');
    });

    it('should reject handle with wrong length', () => {
      const longHandle = '0x' + 'ab'.repeat(33);
      expect(() =>
        validateHandle({
          handle: longHandle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Invalid handle format');
    });

    it('should reject handle with invalid hex characters', () => {
      const invalidHandle = '0x' + 'gg'.repeat(32);
      expect(() =>
        validateHandle({
          handle: invalidHandle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(TypeError);
    });

    it('rejects non-string handle', () => {
      expect(() =>
        validateHandle({
          // eslint-disable-next-line unicorn/no-null
          handle: 12345,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(TypeError);
    });
  });

  describe('chain ID validation (bytes 26-29)', () => {
    it('accepts matching chain ID', () => {
      const handle = buildHandle({ chainId: 421_614, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    it('rejects mismatched chain ID', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 421_614,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Handle chainId mismatch: expected 421614, got 1');
    });

    it('should accept handle with max uint32 chain ID (0xFFFFFFFF)', () => {
      const maxChainId = 0xff_ff_ff_ff;
      const handle = buildHandle({
        chainId: maxChainId,
        typeCode: 0,
        version: 0,
      });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: maxChainId,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });
  });

  describe('type code validation (byte 30)', () => {
    for (const [type, code] of SOLIDITY_TYPE_TO_CODE.entries()) {
      it(`should accept handle with matching type ${type} (code ${code})`, () => {
        const handle = buildHandle({ chainId: 1, typeCode: code, version: 0 });
        expect(() =>
          validateHandle({
            handle,
            expectedChainId: 1,
            expectedSolidityType: type,
          })
        ).not.toThrow();
      });
    }

    it('should reject handle with mismatched type', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 }); // bool
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'uint256',
        })
      ).toThrow('Handle type mismatch: expected uint256, got bool');
    });

    it('should reject handle with reserved type code (100)', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 100, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Unknown handle type code: 100');
    });

    it('throws for reserved type code (255)', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 255, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Unknown handle type code: 255');
    });
  });

  describe('version validation (byte 31)', () => {
    it('accepts version 0', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 0 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();
    });

    const SUPPORTED_VERSIONS = [0];
    it(`should reject handle with version other than ${SUPPORTED_VERSIONS}`, () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 1 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(
        `Unsupported handle version: 1. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      );
    });

    it('should reject handle with version 255', () => {
      const handle = buildHandle({ chainId: 1, typeCode: 0, version: 255 });
      expect(() =>
        validateHandle({
          handle,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow(
        `Unsupported handle version: 255. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      );
    });
  });

  describe('cross-chain isolation', () => {
    it('should reject handle with same prehandle but different chain IDs', () => {
      const handle1 = buildHandle({
        prehandle: 'aa'.repeat(26),
        chainId: 1,
        typeCode: 0,
        version: 0,
      });
      const handle2 = buildHandle({
        prehandle: 'aa'.repeat(26),
        chainId: 2,
        typeCode: 0,
        version: 0,
      });

      expect(() =>
        validateHandle({
          handle: handle1,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).not.toThrow();

      expect(() =>
        validateHandle({
          handle: handle2,
          expectedChainId: 1,
          expectedSolidityType: 'bool',
        })
      ).toThrow('Handle chainId mismatch');
    });
  });
});

/**
 * Handle Proof Structure (137 bytes = 274 hex chars):
 * - [0-19]   Owner (20 bytes)
 * - [20-39]  SmartContractAddress (20 bytes)
 * - [40-71]  CreatedAt (32 bytes)
 * - [72-136] Signature (65 bytes)
 */
describe('validateHandleProof', () => {
  const owner = '0x1234567890123456789012345678901234567890';
  const smartContractAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

  it('accepts valid handleProof', () => {
    expect(() =>
      validateHandleProof({
        handleProof: buildHandleProof({ owner, smartContractAddress }),
        expectedOwner: owner,
        expectedSmartContractAddress: smartContractAddress,
      })
    ).not.toThrow();
  });

  describe('format validation', () => {
    it('rejects wrong length (short)', () => {
      const short = '0x' + 'ab'.repeat(100);
      expect(() =>
        validateHandleProof({
          handleProof: short,
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(
        `Invalid handleProof: expected 0x + 274 hex chars (137 bytes), got ${short}`
      );
    });

    it('rejects wrong length (long)', () => {
      const long = '0x' + 'ab'.repeat(150);
      expect(() =>
        validateHandleProof({
          handleProof: long,
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(
        `Invalid handleProof: expected 0x + 274 hex chars (137 bytes), got ${long}`
      );
    });

    it('rejects invalid hex characters', () => {
      expect(() =>
        validateHandleProof({
          handleProof: '0x' + 'zz'.repeat(137),
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(/Invalid handleProof/);
    });

    it('rejects missing 0x prefix', () => {
      expect(() =>
        validateHandleProof({
          handleProof: 'ab'.repeat(137),
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(/Invalid handleProof/);
    });

    it('rejects non-string', () => {
      expect(() =>
        validateHandleProof({
          // eslint-disable-next-line unicorn/no-null
          handleProof: null as unknown as string,
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(/Invalid handleProof/);
    });
  });

  describe('owner validation', () => {
    it('rejects mismatched owner', () => {
      const wrongOwner = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const proof = buildHandleProof({ owner });
      expect(() =>
        validateHandleProof({
          handleProof: proof,
          expectedOwner: wrongOwner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(`Invalid owner: expected ${wrongOwner}, got ${owner}`);
    });
  });

  describe('smartContractAddress validation', () => {
    it('rejects mismatched smartContractAddress', () => {
      const wrongAddress = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const proof = buildHandleProof({ owner, smartContractAddress });
      expect(() =>
        validateHandleProof({
          handleProof: proof,
          expectedOwner: owner,
          expectedSmartContractAddress: wrongAddress,
        })
      ).toThrow(
        `Invalid smartContractAddress: expected ${wrongAddress}, got ${smartContractAddress}`
      );
    });
  });

  describe('timestamp validation', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const MIN_VALID_TIMESTAMP = 1_767_225_600n; // Jan 1, 2026
    const MAX_FUTURE_DRIFT_SECONDS = 300n; // 5 minutes

    it('should accept recent past timestamp', () => {
      const proof = buildHandleProof({
        createdAt: timestampToHex(nowSeconds - 3600),
        owner,
        smartContractAddress,
      });
      expect(() =>
        validateHandleProof({
          handleProof: proof,
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).not.toThrow();
    });

    it('rejects zero timestamp', () => {
      const proof = buildHandleProof({
        createdAt: '00'.repeat(32),
        owner,
        smartContractAddress,
      });
      expect(() =>
        validateHandleProof({
          handleProof: proof,
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow('Invalid createdAt: timestamp cannot be zero');
    });

    it('rejects timestamp before Jan 2026', () => {
      const old = 1_700_000_000n; // Nov 2023
      const proof = buildHandleProof({
        createdAt: timestampToHex(old),
        owner,
        smartContractAddress,
      });
      expect(() =>
        validateHandleProof({
          handleProof: proof,
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(
        `Invalid createdAt: timestamp ${old} is before minimum valid timestamp ${MIN_VALID_TIMESTAMP}`
      );
    });

    it('rejects timestamp too far in future (> 5 min)', () => {
      const future = BigInt(nowSeconds) + MAX_FUTURE_DRIFT_SECONDS + 1n;
      const proof = buildHandleProof({
        createdAt: timestampToHex(future),
        owner,
        smartContractAddress,
      });
      expect(() =>
        validateHandleProof({
          handleProof: proof,
          expectedOwner: owner,
          expectedSmartContractAddress: smartContractAddress,
        })
      ).toThrow(
        `Invalid createdAt: timestamp ${future} is too far in the future (max drift: ${MAX_FUTURE_DRIFT_SECONDS}s)`
      );
    });
  });

  // Note: Signature length (65 bytes) is implicitly validated by INPUT_PROOF_PATTERN regex
  // If format validation passes, signature is always correct length
});
