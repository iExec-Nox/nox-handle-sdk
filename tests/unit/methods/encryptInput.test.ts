import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptInput } from '../../../src/methods/encryptInput.js';
import type { IApiService } from '../../../src/services/api/IApiService.js';
import type { IBlockchainService } from '../../../src/services/blockchain/IBlockchainService.js';

vi.mock('../../../src/utils/validators.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../src/utils/validators.js')>();
  return { ...actual, validateHandle: vi.fn(), validateInputProof: vi.fn() };
});

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_HANDLE =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const MOCK_INPUT_PROOF = '0x' + 'ab'.repeat(137);

function createMockBlockchainService(
  overrides: Partial<IBlockchainService> = {}
): IBlockchainService {
  return {
    getChainId: vi.fn().mockResolvedValue(1),
    getAddress: vi.fn().mockResolvedValue(TEST_ADDRESS),
    signTypedData: vi.fn().mockResolvedValue('0xsignature'),
    verifyTypedData: vi.fn().mockResolvedValue(TEST_ADDRESS),
    readContract: vi.fn().mockResolvedValue(true),
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

describe('encryptInput', () => {
  let mockBlockchainService: IBlockchainService;
  let mockApiService: IApiService;

  beforeEach(() => {
    mockBlockchainService = createMockBlockchainService();
    mockApiService = createMockApiService();
  });

  describe('encoding', () => {
    it('encodes bool true as 0x01', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: '0x01', solidityType: 'bool', owner: TEST_ADDRESS },
      });
    });

    it('encodes bool false as 0x00', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: false,
        solidityType: 'bool',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: '0x00', solidityType: 'bool', owner: TEST_ADDRESS },
      });
    });

    it('encodes string as hex', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: 'hello world',
        solidityType: 'string',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: '0x68656c6c6f20776f726c64',
          solidityType: 'string',
          owner: TEST_ADDRESS,
        },
      });
    });

    it('passes address as-is', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: address,
        solidityType: 'address',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: address, solidityType: 'address', owner: TEST_ADDRESS },
      });
    });

    it('passes bytes as-is', async () => {
      const bytes = '0xdeadbeef';
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: bytes,
        solidityType: 'bytes',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: bytes, solidityType: 'bytes', owner: TEST_ADDRESS },
      });
    });

    it('encodes uint256 as padded hex', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: 1_000_000n,
        solidityType: 'uint256',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value:
            '0x00000000000000000000000000000000000000000000000000000000000f4240',
          solidityType: 'uint256',
          owner: TEST_ADDRESS,
        },
      });
    });

    it('encodes negative int128 as twos complement hex', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: -500n,
        solidityType: 'int128',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: '0xfffffffffffffffffffffffffffffe0c',
          solidityType: 'int128',
          owner: TEST_ADDRESS,
        },
      });
    });
  });

  describe('solidity type validation', () => {
    it('rejects invalid solidity type', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'value',
          solidityType: 'invalidType' as never,
        })
      ).rejects.toThrow('Invalid Solidity type: invalidType');
    });

    it('rejects uint7 (not multiple of 8)', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 1n,
          solidityType: 'uint7' as never,
        })
      ).rejects.toThrow('Invalid Solidity type: uint7');
    });

    it('rejects bytes33 (exceeds max)', async () => {
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

  describe('value validation', () => {
    it('rejects non-boolean for bool', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'true',
          solidityType: 'bool',
        })
      ).rejects.toThrow('Invalid boolean value: expected boolean');
    });

    it('rejects non-string for string', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'string',
        })
      ).rejects.toThrow('Invalid value: expected string');
    });

    it('rejects invalid address format', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '0x1234',
          solidityType: 'address',
        })
      ).rejects.toThrow('Invalid value for address');
    });

    it('rejects invalid bytes format', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'not hex',
          solidityType: 'bytes',
        })
      ).rejects.toThrow('Invalid value for bytes');
    });

    it('rejects bytesN exceeding max length', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '0x1234567890',
          solidityType: 'bytes4',
        })
      ).rejects.toThrow('Invalid value for bytes4');
    });

    it('rejects non-bigint for uint256', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '1000',
          solidityType: 'uint256',
        })
      ).rejects.toThrow('Invalid value: expected bigint');
    });

    it('rejects negative for uint', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: -1n,
          solidityType: 'uint256',
        })
      ).rejects.toThrow('Invalid uint256 value');
    });

    it('rejects uint exceeding max', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 256n,
          solidityType: 'uint8',
        })
      ).rejects.toThrow('Invalid uint8 value');
    });

    it('rejects int out of range', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 128n,
          solidityType: 'int8',
        })
      ).rejects.toThrow('Invalid int8 value');
    });
  });

  describe('API error handling', () => {
    it('throws on non-ok API response', async () => {
      mockApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          data: { error: 'Bad request' },
        }),
      });
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Gateway API error: 400');
    });

    it('throws on missing handle in response', async () => {
      mockApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { inputProof: MOCK_INPUT_PROOF },
        }),
      });
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Invalid gateway response');
    });

    it('propagates network errors', async () => {
      mockApiService = createMockApiService({
        post: vi.fn().mockRejectedValue(new Error('Network error')),
      });
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('blockchain service integration', () => {
    it('calls getAddress and getChainId', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
      });
      expect(mockBlockchainService.getAddress).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
    });

    it('includes owner in API request', async () => {
      const customAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      mockBlockchainService = createMockBlockchainService({
        getAddress: vi.fn().mockResolvedValue(customAddress),
      });
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: { value: '0x01', solidityType: 'bool', owner: customAddress },
      });
    });

    it('propagates blockchain service errors', async () => {
      mockBlockchainService = createMockBlockchainService({
        getAddress: vi
          .fn()
          .mockRejectedValue(new Error('Wallet not connected')),
      });
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Wallet not connected');
    });
  });
});
