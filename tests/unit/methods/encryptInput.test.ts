import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptInput } from '../../../src/methods/encryptInput.js';
import type { IApiService } from '../../../src/services/api/IApiService.js';
import type { IBlockchainService } from '../../../src/services/blockchain/IBlockchainService.js';

// Mock the validators module to skip handle/inputProof validation in encryptInput tests
// These are tested separately in validators.test.ts
vi.mock('../../../src/utils/validators.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../src/utils/validators.js')>();
  return {
    ...actual,
    validateHandle: vi.fn(),
    validateInputProofFormat: vi.fn(),
  };
});

// ============================================================================
// Mock Factories
// ============================================================================

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_HANDLE =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
// 117 bytes = 234 hex chars
const MOCK_INPUT_PROOF = '0x' + 'ab'.repeat(117);

function createMockBlockchainService(
  overrides: Partial<IBlockchainService> = {}
): IBlockchainService {
  return {
    getChainId: vi.fn().mockResolvedValue(1),
    getAddress: vi.fn().mockResolvedValue(TEST_ADDRESS),
    signTypedData: vi.fn().mockResolvedValue('0xsignature'),
    ...overrides,
  };
}

function createMockApiService(
  overrides: Partial<IApiService> = {}
): IApiService {
  return {
    get: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
    post: vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: { handle: MOCK_HANDLE, inputProof: MOCK_INPUT_PROOF },
    }),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('encryptInput', () => {
  let mockBlockchainService: IBlockchainService;
  let mockApiService: IApiService;

  beforeEach(() => {
    mockBlockchainService = createMockBlockchainService();
    mockApiService = createMockApiService();
  });

  // ==========================================================================
  // Successful Encryption
  // ==========================================================================

  describe('successful encryption', () => {
    it('should encrypt a boolean value (bool)', async () => {
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
      });

      expect(result).toEqual({
        handle: MOCK_HANDLE,
        inputProof: MOCK_INPUT_PROOF,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: 'true', solidityType: 'bool', owner: TEST_ADDRESS },
      });
    });

    it('should encrypt a string value', async () => {
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: 'hello world',
        solidityType: 'string',
      });

      expect(result.handle).toBe(MOCK_HANDLE);
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: 'hello world',
          solidityType: 'string',
          owner: TEST_ADDRESS,
        },
      });
    });

    it('should encrypt an address value', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: address,
        solidityType: 'address',
      });

      expect(result.handle).toBe(MOCK_HANDLE);
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: address, solidityType: 'address', owner: TEST_ADDRESS },
      });
    });

    it('should encrypt a bytes value', async () => {
      const bytes = '0xdeadbeef';
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: bytes,
        solidityType: 'bytes',
      });

      expect(result.handle).toBe(MOCK_HANDLE);
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: bytes, solidityType: 'bytes', owner: TEST_ADDRESS },
      });
    });

    it('should encrypt a bytes32 value', async () => {
      const bytes32 = '0x' + 'ab'.repeat(32);
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: bytes32,
        solidityType: 'bytes32',
      });

      expect(result.handle).toBe(MOCK_HANDLE);
    });

    it('should encrypt a uint256 value (bigint)', async () => {
      const inputValue = 1_000_000n;
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: inputValue,
        solidityType: 'uint256',
      });

      expect(result.handle).toBe(MOCK_HANDLE);
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: '1000000',
          solidityType: 'uint256',
          owner: TEST_ADDRESS,
        },
      });
    });

    it('should encrypt a int128 value (negative bigint)', async () => {
      const inputValue = -500n;
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: inputValue,
        solidityType: 'int128',
      });

      expect(result.handle).toBe(MOCK_HANDLE);
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: '-500', solidityType: 'int128', owner: TEST_ADDRESS },
      });
    });

    it('should encrypt a small bytes value into a larger bytesN type', async () => {
      // bytes4 value into bytes32 type (should be allowed)
      const smallValue = '0xdeadbeef';
      const result = await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: smallValue,
        solidityType: 'bytes32',
      });

      expect(result.handle).toBe(MOCK_HANDLE);
    });
  });

  // ==========================================================================
  // Solidity Type Validation
  // ==========================================================================

  describe('solidityType validation', () => {
    it('should throw TypeError for invalid Solidity type', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'value',
          solidityType: 'invalidType' as never,
        })
      ).rejects.toThrow(TypeError);

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'value',
          solidityType: 'uint7' as never, // not a multiple of 8
        })
      ).rejects.toThrow('Invalid Solidity type: uint7');
    });

    it('should throw TypeError for bytes33 (invalid size)', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '0x',
          solidityType: 'bytes33' as never,
        })
      ).rejects.toThrow('Invalid Solidity type: bytes33');
    });
  });

  // ==========================================================================
  // Input Value Validation
  // ==========================================================================

  describe('value validation', () => {
    describe('bool type', () => {
      it('should reject non-boolean value for bool', async () => {
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: 'true',
            solidityType: 'bool',
          })
        ).rejects.toThrow('Invalid value for bool: expected boolean');

        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: 1n,
            solidityType: 'bool',
          })
        ).rejects.toThrow('Invalid value for bool: expected boolean');
      });
    });

    describe('string type', () => {
      it('should reject non-string value for string', async () => {
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: true,
            solidityType: 'string',
          })
        ).rejects.toThrow('Invalid value for string: expected string');

        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: 123n,
            solidityType: 'string',
          })
        ).rejects.toThrow('Invalid value for string: expected string');
      });
    });

    describe('address type', () => {
      it('should reject invalid address format', async () => {
        // Too short
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: '0x1234',
            solidityType: 'address',
          })
        ).rejects.toThrow('Invalid value for address');

        // Missing 0x prefix
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: '1234567890123456789012345678901234567890',
            solidityType: 'address',
          })
        ).rejects.toThrow('Invalid value for address');

        // Invalid hex characters
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
            solidityType: 'address',
          })
        ).rejects.toThrow('Invalid value for address');
      });

      it('should accept valid address', async () => {
        const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
        const result = await encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: validAddress,
          solidityType: 'address',
        });
        expect(result.handle).toBe(MOCK_HANDLE);
      });
    });

    describe('bytes type', () => {
      it('should reject invalid hex string for bytes', async () => {
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: 'not hex',
            solidityType: 'bytes',
          })
        ).rejects.toThrow('Invalid value for bytes');

        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: '0xGG',
            solidityType: 'bytes',
          })
        ).rejects.toThrow('Invalid value for bytes');
      });

      it('should accept empty bytes', async () => {
        const result = await encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '0x',
          solidityType: 'bytes',
        });
        expect(result.handle).toBe(MOCK_HANDLE);
      });
    });

    describe('bytesN types', () => {
      it('should reject value exceeding max length for bytesN', async () => {
        // bytes4 max = 8 hex chars, providing 10
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: '0x1234567890', // 10 hex chars = 5 bytes
            solidityType: 'bytes4',
          })
        ).rejects.toThrow('Invalid value for bytes4');
      });

      it('should accept value smaller than max length for bytesN', async () => {
        // bytes4 max = 8 hex chars, providing 4
        const result = await encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '0x1234', // 4 hex chars = 2 bytes
          solidityType: 'bytes4',
        });
        expect(result.handle).toBe(MOCK_HANDLE);
      });
    });

    describe('uint/int types', () => {
      it('should reject non-bigint value for uint256', async () => {
        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: '1000',
            solidityType: 'uint256',
          })
        ).rejects.toThrow('Invalid value for uint256: expected bigint');

        await expect(
          encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: 1000 as never,
            solidityType: 'uint256',
          })
        ).rejects.toThrow('Invalid value for uint256: expected bigint');
      });

      it('should accept bigint for various uint sizes', async () => {
        for (const type of ['uint8', 'uint64', 'uint128', 'uint256'] as const) {
          const result = await encryptInput({
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            value: 42n,
            solidityType: type,
          });
          expect(result.handle).toBe(MOCK_HANDLE);
        }
      });

      it('should accept negative bigint for int types', async () => {
        const result = await encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: -999_999_999n,
          solidityType: 'int256',
        });
        expect(result.handle).toBe(MOCK_HANDLE);
      });
    });
  });

  // ==========================================================================
  // API Error Handling
  // ==========================================================================

  describe('API error handling', () => {
    it('should throw error when API returns non-ok status', async () => {
      const errorApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          data: { error: 'Bad request' },
        }),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: errorApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Gateway API error: 400');
    });

    it('should throw error when API returns 500 status', async () => {
      const errorApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          data: { error: 'Internal server error' },
        }),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: errorApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Gateway API error: 500');
    });

    it('should throw error when API returns 401 unauthorized', async () => {
      const errorApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          data: { error: 'Unauthorized' },
        }),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: errorApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Gateway API error: 401');
    });

    it('should throw error when response is missing handle', async () => {
      const badResponseApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { inputProof: MOCK_INPUT_PROOF }, // missing handle
        }),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: badResponseApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow(
        'Invalid gateway response: missing handle or inputProof'
      );
    });

    it('should throw error when response is missing inputProof', async () => {
      const badResponseApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { handle: MOCK_HANDLE }, // missing inputProof
        }),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: badResponseApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow(
        'Invalid gateway response: missing handle or inputProof'
      );
    });

    it('should throw error when response data is empty', async () => {
      const undefinedResponseApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: undefined,
        }),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: undefinedResponseApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow(
        'Invalid gateway response: missing handle or inputProof'
      );
    });

    it('should propagate network errors', async () => {
      const networkErrorApiService = createMockApiService({
        post: vi
          .fn()
          .mockRejectedValue(new Error('Network error: ECONNREFUSED')),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: networkErrorApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Network error: ECONNREFUSED');
    });

    it('should propagate timeout errors', async () => {
      const timeoutApiService = createMockApiService({
        post: vi.fn().mockRejectedValue(new Error('Request timeout')),
      });

      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: timeoutApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Request timeout');
    });
  });

  // ==========================================================================
  // Blockchain Service Integration
  // ==========================================================================

  describe('blockchain service integration', () => {
    it('should call getAddress to get the owner', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
      });

      expect(mockBlockchainService.getAddress).toHaveBeenCalledTimes(1);
    });

    it('should call getChainId for handle validation', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
      });

      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
    });

    it('should include owner address in API request', async () => {
      const customAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const customBlockchainService = createMockBlockchainService({
        getAddress: vi.fn().mockResolvedValue(customAddress),
      });

      await encryptInput({
        blockchainService: customBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
      });

      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: 'true', solidityType: 'bool', owner: customAddress },
      });
    });

    it('should propagate blockchain service errors', async () => {
      const errorBlockchainService = createMockBlockchainService({
        getAddress: vi
          .fn()
          .mockRejectedValue(new Error('Wallet not connected')),
      });

      await expect(
        encryptInput({
          blockchainService: errorBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Wallet not connected');
    });
  });
});
