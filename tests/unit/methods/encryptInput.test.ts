import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptInput } from '../../../src/methods/encryptInput.js';
import type { IApiService } from '../../../src/services/api/IApiService.js';
import type { IBlockchainService } from '../../../src/services/blockchain/IBlockchainService.js';
import { TEST_BLOCK_NUMBER } from '../../helpers/testData.js';

vi.mock('../../../src/utils/validators.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../src/utils/validators.js')>();
  return { ...actual, validateHandle: vi.fn(), validateHandleProof: vi.fn() };
});

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_INPUT_PROOF = '0x' + 'ab'.repeat(137);

// Handle layout: byte0=version, bytes1-4=chainId, byte5=typeCode, byte6=attribute, bytes7-31=filler
// bool=0x00, uint256=0x23
function buildMockHandle(
  typeCode: number,
  chainId: number,
  attribute: 0 | 1 = 0
): string {
  const chainIdHex = chainId.toString(16).padStart(8, '0');
  const typeCodeHex = typeCode.toString(16).padStart(2, '0');
  const attributeHex = attribute.toString(16).padStart(2, '0');
  return `0x00${chainIdHex}${typeCodeHex}${attributeHex}${'ab'.repeat(25)}`;
}

const MOCK_HANDLE = buildMockHandle(0x00, 1); // bool, chainId=1

function createMockBlockchainService(
  overrides: Partial<IBlockchainService> = {}
): IBlockchainService {
  return {
    getChainId: vi.fn().mockResolvedValue(1),
    getBlockNumber: vi.fn().mockResolvedValue(TEST_BLOCK_NUMBER),
    getAddress: vi.fn().mockResolvedValue(TEST_ADDRESS),
    signTypedData: vi.fn().mockResolvedValue('0xsignature'),
    readContract: vi.fn().mockResolvedValue(true),
    verifyTypedData: vi.fn().mockResolvedValue(TEST_ADDRESS),
    ...overrides,
  };
}

function createMockApiService(
  overrides: Partial<IApiService> = {},
  handle: string = MOCK_HANDLE
): IApiService {
  const data = {
    handle,
    proof: MOCK_INPUT_PROOF,
  };

  return {
    get: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
    post: vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data,
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
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        query: { chain_id: 1 },
        body: {
          value: '0x01',
          solidityType: 'bool',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
        expectedResponse: {
          types: {
            HandleWithProof: [
              { name: 'handle', type: 'string' },
              { name: 'proof', type: 'string' },
            ],
          },
          primaryType: 'HandleWithProof',
        },
      });
    });

    it('encodes bool false as 0x00', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,

        value: false,
        solidityType: 'bool',
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        query: { chain_id: 1 },
        body: {
          value: '0x00',
          solidityType: 'bool',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
        expectedResponse: {
          types: {
            HandleWithProof: [
              { name: 'handle', type: 'string' },
              { name: 'proof', type: 'string' },
            ],
          },
          primaryType: 'HandleWithProof',
        },
      });
    });

    // NOX: 'string' is not supported
    it.skip('encodes string as hex', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: 'hello world',
        solidityType: 'string',
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: '0x68656c6c6f20776f726c64',
          solidityType: 'string',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
      });
    });

    // NOX: 'address' is not supported
    it.skip('passes address as-is', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: address,
        solidityType: 'address',
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: address,
          solidityType: 'address',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
      });
    });

    // NOX: 'bytes' is not supported
    it.skip('passes bytes as-is', async () => {
      const bytes = '0xdeadbeef';
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: bytes,
        solidityType: 'bytes',
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: bytes,
          solidityType: 'bytes',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
      });
    });

    it('encodes uint256 as padded hex', async () => {
      mockApiService = createMockApiService({}, buildMockHandle(0x23, 1));
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: 1_000_000n,
        solidityType: 'uint256',
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        query: { chain_id: 1 },
        body: {
          value:
            '0x00000000000000000000000000000000000000000000000000000000000f4240',
          solidityType: 'uint256',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
        expectedResponse: {
          types: {
            HandleWithProof: [
              { name: 'handle', type: 'string' },
              { name: 'proof', type: 'string' },
            ],
          },
          primaryType: 'HandleWithProof',
        },
      });
    });

    // NOX: 'int128' is not supported
    it.skip('encodes negative int128 as twos complement hex', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: -500n,
        solidityType: 'int128',
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        body: {
          value: '0xfffffffffffffffffffffffffffffe0c',
          solidityType: 'int128',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
      });
    });
  });

  describe('required parameters validation', () => {
    it('rejects missing value', async () => {
      await expect(
        // @ts-expect-error - Testing runtime validation of missing required param
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          solidityType: 'bool',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Missing required parameters: value');
    });

    it('rejects missing solidityType', async () => {
      await expect(
        // @ts-expect-error - Testing runtime validation of missing required params
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Missing required parameters: solidityType');
    });

    it('rejects missing applicationContract', async () => {
      await expect(
        // @ts-expect-error - Testing runtime validation of missing required params
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: false,
          solidityType: 'bool',
        })
      ).rejects.toThrow('Missing required parameters: applicationContract');
    });

    it('rejects missing multiple required parameters', async () => {
      await expect(
        // @ts-expect-error - Testing runtime validation of missing required params
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
        })
      ).rejects.toThrow(
        'Missing required parameters: value, solidityType, applicationContract'
      );
    });
  });

  describe('solidity type validation', () => {
    it('rejects unsupported types with complete error message', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'hello',
          solidityType: 'string' as never,
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow(
        'Unsupported Solidity type for encryption: string. Nox protocol only supports: bool, uint16, uint256, int16, int256'
      );
    });

    it('rejects invalid solidity type', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'value',
          solidityType: 'invalidType' as never,
          applicationContract: TEST_ADDRESS,
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
          applicationContract: TEST_ADDRESS,
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
          applicationContract: TEST_ADDRESS,
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
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Invalid boolean value: expected boolean');
    });

    // NOX: 'string' is not supported
    it.skip('rejects non-string for string', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'string',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Invalid value: expected string');
    });

    // NOX: 'address' is not supported
    it.skip('rejects invalid address format', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '0x1234',
          solidityType: 'address',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Invalid value for address');
    });

    // NOX: 'bytes' is not supported
    it.skip('rejects invalid bytes format', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 'not hex',
          solidityType: 'bytes',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Invalid value for bytes');
    });

    // NOX: 'bytes4' is not supported
    it.skip('rejects bytesN exceeding max length', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: '0x1234567890',
          solidityType: 'bytes4',
          applicationContract: TEST_ADDRESS,
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
          applicationContract: TEST_ADDRESS,
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
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Invalid uint256 value');
    });

    // NOX: 'uint8' is not supported
    it.skip('rejects uint exceeding max', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 256n,
          solidityType: 'uint8',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Invalid uint8 value');
    });

    // NOX: 'int8' is not supported
    it.skip('rejects int out of range', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 128n,
          solidityType: 'int8',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Invalid int8 value');
    });
  });

  describe('app contract address validation', () => {
    it('rejects invalid app contract address', async () => {
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
          applicationContract: '0x1234',
        })
      ).rejects.toThrow('Invalid value for address');
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
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow(
        `Unexpected response from Handle Gateway: status: 400, data: {"error":"Bad request"}`
      );
    });

    it('throws on missing handle in response', async () => {
      mockApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: { proof: MOCK_INPUT_PROOF },
        }),
      });
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow(
        'Unexpected response from Handle Gateway: status: 200, data: {"proof":"0xababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababab"}'
      );
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
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Network error');
    });

    it('rejects mismatched chainId in gateway response', async () => {
      mockApiService = createMockApiService(
        {},
        buildMockHandle(0x00, 2) // chainId=2, but getChainId returns 1
      );
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow(
        'Unexpected response from Handle Gateway: handle chainId mismatch: expected 1, got 2'
      );
    });

    it('rejects mismatched type in gateway response', async () => {
      mockApiService = createMockApiService(
        {},
        buildMockHandle(0x00, 1) // bool handle, but solidityType is uint256
      );
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: 1_000_000n,
          solidityType: 'uint256',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow(
        'Unexpected response from Handle Gateway: handle type mismatch: expected uint256, got bool'
      );
    });

    it('rejects invalid handleProof in gateway response', async () => {
      mockApiService = createMockApiService({
        post: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: {
            handle: buildMockHandle(0x00, 1),
            proof: '0x' + 'ab'.repeat(10), // too short
          },
        }),
      });
      await expect(
        encryptInput({
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          value: true,
          solidityType: 'bool',
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow(
        'Unexpected response from Handle Gateway: invalid handleProof: expected 0x + 274 hex chars (137 bytes)'
      );
    });
  });

  describe('blockchain service integration', () => {
    it('calls getAddress and getChainId', async () => {
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
        applicationContract: TEST_ADDRESS,
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
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        query: { chain_id: 1 },
        body: {
          value: '0x01',
          solidityType: 'bool',
          owner: customAddress,
          applicationContract: TEST_ADDRESS,
        },
        expectedResponse: {
          types: {
            HandleWithProof: [
              { name: 'handle', type: 'string' },
              { name: 'proof', type: 'string' },
            ],
          },
          primaryType: 'HandleWithProof',
        },
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
          applicationContract: TEST_ADDRESS,
        })
      ).rejects.toThrow('Wallet not connected');
    });

    it('sends the chain ID from the connected network in the query params', async () => {
      mockBlockchainService = createMockBlockchainService({
        getChainId: vi.fn().mockResolvedValue(421_614),
      });
      mockApiService = createMockApiService({}, buildMockHandle(0x00, 421_614));
      await encryptInput({
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        value: true,
        solidityType: 'bool',
        applicationContract: TEST_ADDRESS,
      });
      expect(mockApiService.post).toHaveBeenCalledWith({
        endpoint: '/v0/secrets',
        query: { chain_id: 421_614 },
        body: {
          value: '0x01',
          solidityType: 'bool',
          owner: TEST_ADDRESS,
          applicationContract: TEST_ADDRESS,
        },
        expectedResponse: {
          types: {
            HandleWithProof: [
              { name: 'handle', type: 'string' },
              { name: 'proof', type: 'string' },
            ],
          },
          primaryType: 'HandleWithProof',
        },
      });
    });
  });
});
