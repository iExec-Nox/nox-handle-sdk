import { BrowserProvider } from 'ethers';
import { describe, expect, it, vi } from 'vitest';
import type { HandleClientConfig } from '../../../src/index.js';
import { publicDecrypt } from '../../../src/methods/publicDecrypt.js';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import type { ISubgraphService } from '../../../src/services/subgraph/SubgraphService.js';
import {
  NotYetComputedHandleError,
  UnknownHandleError,
} from '../../../src/utils/error.js';
import { buildHandle, createMockEIP1193Provider } from '../../helpers/mocks.js';
import {
  DUMMY_DECRYPTION_PROOF_SIGNATURE,
  DUMMY_TYPED_HANDLES,
  SUPPORTED_CHAIN_ID,
  TEST_BLOCK_NUMBER,
  TEST_ENCRYPTED_DATA,
  TEST_PRIVATE_KEY,
} from '../../helpers/testData.js';

describe('publicDecrypt', () => {
  const mockProvider = createMockEIP1193Provider(
    SUPPORTED_CHAIN_ID,
    TEST_PRIVATE_KEY
  );

  const mockConfig: HandleClientConfig = {
    gatewayUrl: 'https://example.com',
    smartContractAddress: '0x0000000000000000000000000000000000000000',
    subgraphUrl: 'https://subgraph.example.com',
  };

  const mockBlockchainService = new EthersBlockchainService(
    new BrowserProvider(mockProvider)
  );

  const mockApiService = {
    get: vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('Not implemented'))),
    post: vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('Not implemented'))),
  };

  const mockSubgraphService: ISubgraphService = {
    subgraphUrl: mockConfig.subgraphUrl,
    request: vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('Not implemented'))),
  };

  // by default, mock isPubliclyDecryptable to return true
  mockProvider.mocks.call.mockResolvedValue('0x01'.padEnd(66, '0')); // true

  describe('successful decryptions', () => {
    const testCases = [
      {
        solidityType: 'string',
        jsType: 'string',
        dummyTypedHandle: DUMMY_TYPED_HANDLES.string,
        encryptedData: TEST_ENCRYPTED_DATA.string,
      },
      {
        solidityType: 'bytes',
        jsType: 'string',
        dummyTypedHandle: DUMMY_TYPED_HANDLES.bytes,
        encryptedData: TEST_ENCRYPTED_DATA.bytes,
      },
      {
        solidityType: 'bool',
        jsType: 'boolean',
        dummyTypedHandle: DUMMY_TYPED_HANDLES.bool,
        encryptedData: TEST_ENCRYPTED_DATA.bool,
      },
      {
        solidityType: 'int64',
        jsType: 'bigint',
        dummyTypedHandle: DUMMY_TYPED_HANDLES.int64,
        encryptedData: TEST_ENCRYPTED_DATA.int64,
      },
      {
        solidityType: 'uint256',
        jsType: 'bigint',
        dummyTypedHandle: DUMMY_TYPED_HANDLES.uint256,
        encryptedData: TEST_ENCRYPTED_DATA.uint256,
      },
      {
        solidityType: 'bytes8',
        jsType: 'string',
        dummyTypedHandle: DUMMY_TYPED_HANDLES.bytes8,
        encryptedData: TEST_ENCRYPTED_DATA.bytes8,
      },
      {
        solidityType: 'address',
        jsType: 'string',
        dummyTypedHandle: DUMMY_TYPED_HANDLES.address,
        encryptedData: TEST_ENCRYPTED_DATA.address,
      },
    ];

    for (const {
      solidityType,
      jsType,
      dummyTypedHandle,
      encryptedData,
    } of testCases) {
      it(`should decrypt a solidity ${solidityType} handle into a JS ${jsType}`, async () => {
        mockApiService.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          data: {
            decryptionProof:
              DUMMY_DECRYPTION_PROOF_SIGNATURE +
              encryptedData.plaintext.slice(2),
          },
        });
        const result = await publicDecrypt({
          handle: dummyTypedHandle,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        });
        expect(result).toStrictEqual({
          value: encryptedData.value,
          solidityType,
          decryptionProof:
            DUMMY_DECRYPTION_PROOF_SIGNATURE + encryptedData.plaintext.slice(2),
        });
      });
    }
  });

  describe('when handle is not publicly decryptable', () => {
    it('should throw', async () => {
      // Set mock to return false for isPubliclyDecryptable
      mockProvider.mocks.call.mockResolvedValueOnce('0x00'.padEnd(66, '0')); // false
      await expect(
        publicDecrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `Handle (${DUMMY_TYPED_HANDLES.bool}) does not exist or is not publicly decryptable`
        )
      );

      expect(mockApiService.get).not.toHaveBeenCalled();
    });
  });

  describe('when handle chain ID mismatches', () => {
    it('should throw', async () => {
      await expect(
        publicDecrypt({
          handle: buildHandle({ chainId: SUPPORTED_CHAIN_ID + 1, typeCode: 0 }),
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        `Handle chainId (${SUPPORTED_CHAIN_ID + 1}) does not match connected chainId (${SUPPORTED_CHAIN_ID})`
      );
      expect(mockApiService.get).not.toHaveBeenCalled();
    });
  });

  describe('when handle is a zero handle', () => {
    it('should throw for an all-zero handle (uninitialized Solidity bytes32)', async () => {
      const zeroHandle =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      await expect(
        publicDecrypt({
          handle: zeroHandle,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        })
      ).rejects.toThrow('Invalid handle: zero hash is not a valid handle');
      expect(mockApiService.get).not.toHaveBeenCalled();
    });
  });

  describe('when gateway returns HTTP 404', () => {
    const notFoundResponse = {
      ok: false,
      status: 404,
      data: { error: 'Not Found' },
    };

    describe('unique handle (attribute = 1)', () => {
      const uniqueHandle = buildHandle({
        chainId: SUPPORTED_CHAIN_ID,
        typeCode: 0,
        attribute: 1,
      });

      it('should throw NotYetComputedHandleError without querying subgraph', async () => {
        mockApiService.get.mockResolvedValue(notFoundResponse);
        vi.useFakeTimers();
        // capture the promise settlement without throwing
        const decryptSettlementPromise = publicDecrypt({
          handle: uniqueHandle,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        }).then(
          (value) => ({ status: 'fulfilled' as const, value }),
          (error) => ({ status: 'rejected' as const, reason: error })
        );
        await vi.runAllTimersAsync();
        const decryptSettlement = await decryptSettlementPromise;
        expect(decryptSettlement).toEqual({
          status: 'rejected',
          reason: new NotYetComputedHandleError(uniqueHandle),
        });
        expect(mockSubgraphService.request).not.toHaveBeenCalled();
      });
    });

    describe('non-unique handle (attribute = 0)', () => {
      const nonUniqueHandle = buildHandle({
        chainId: SUPPORTED_CHAIN_ID,
        typeCode: 0,
        attribute: 0,
      });

      it('should throw NotYetComputedHandleError when handle exists in subgraph', async () => {
        mockApiService.get.mockResolvedValue(notFoundResponse);
        vi.mocked(mockSubgraphService.request).mockResolvedValueOnce({
          _meta: {
            block: {
              number: TEST_BLOCK_NUMBER,
            },
          },
          handle: {
            isPubliclyDecryptable: true,
            admins: [],
            viewers: [],
          },
        });
        vi.useFakeTimers();
        // capture the promise settlement without throwing
        const decryptSettlementPromise = publicDecrypt({
          handle: nonUniqueHandle,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        }).then(
          (value) => ({ status: 'fulfilled' as const, value }),
          (error) => ({ status: 'rejected' as const, reason: error })
        );
        await vi.runAllTimersAsync();
        const decryptSettlement = await decryptSettlementPromise;
        expect(decryptSettlement).toEqual({
          status: 'rejected',
          reason: new NotYetComputedHandleError(nonUniqueHandle),
        });
      });

      it('should throw UnknownHandleError when handle does not exist in subgraph', async () => {
        mockApiService.get.mockResolvedValueOnce(notFoundResponse);
        vi.mocked(mockSubgraphService.request).mockResolvedValueOnce({
          _meta: {
            block: {
              number: TEST_BLOCK_NUMBER,
            },
          },
          // eslint-disable-next-line unicorn/no-null
          handle: null,
        });
        await expect(
          publicDecrypt({
            handle: nonUniqueHandle,
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            subgraphService: mockSubgraphService,
            config: mockConfig,
          })
        ).rejects.toThrow(new UnknownHandleError(nonUniqueHandle));
      });

      it('should throw when subgraph query fails', async () => {
        mockApiService.get.mockResolvedValueOnce(notFoundResponse);
        const subgraphError = new Error('Subgraph unavailable');
        vi.mocked(mockSubgraphService.request).mockRejectedValueOnce(
          subgraphError
        );
        await expect(
          publicDecrypt({
            handle: nonUniqueHandle,
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            subgraphService: mockSubgraphService,
            config: mockConfig,
          })
        ).rejects.toThrow(
          new Error('Failed to decrypt, handle existence is not verified.', {
            cause: subgraphError,
          })
        );
      });
    });

    describe('when handle is not yet computed', () => {
      it('should retry to get computed data', async () => {
        mockApiService.get
          .mockResolvedValueOnce(notFoundResponse)
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            data: {
              decryptionProof:
                DUMMY_DECRYPTION_PROOF_SIGNATURE +
                TEST_ENCRYPTED_DATA.bool.plaintext.slice(2),
            },
          });
        vi.useFakeTimers();
        const decryptionPromise = publicDecrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        });
        await vi.runAllTimersAsync();
        const result = await decryptionPromise;

        expect(result).toStrictEqual({
          value: TEST_ENCRYPTED_DATA.bool.value,
          solidityType: 'bool',
          decryptionProof:
            DUMMY_DECRYPTION_PROOF_SIGNATURE +
            TEST_ENCRYPTED_DATA.bool.plaintext.slice(2),
        });
        expect(mockApiService.get).toHaveBeenCalledTimes(2);
      });

      it('should throw if computed data is still not available after 3 retries', async () => {
        mockApiService.get.mockResolvedValue(notFoundResponse);
        vi.useFakeTimers();
        // capture the promise settlement without throwing
        const decryptSettlementPromise = publicDecrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        }).then(
          (value) => ({ status: 'fulfilled' as const, value }),
          (error) => ({ status: 'rejected' as const, reason: error })
        );
        await vi.runAllTimersAsync();
        const decryptSettlement = await decryptSettlementPromise;
        expect(decryptSettlement).toEqual({
          status: 'rejected',
          reason: new NotYetComputedHandleError(DUMMY_TYPED_HANDLES.bool),
        });
        expect(mockApiService.get).toHaveBeenCalledTimes(4); // initial try + 3 retries
      });
    });
  });

  describe('when handle gateway returns unexpected data', () => {
    const testCases = [
      {
        name: 'response has non-200 status',
        apiResponse: { ok: true, status: 201, data: { foo: 'Oops!' } },
      },
      {
        name: 'response has missing data',
        apiResponse: { ok: true, status: 200 },
      },
      {
        name: 'response has missing data.decryptionProof',
        apiResponse: {
          ok: true,
          status: 200,
          data: {},
        },
      },
      {
        name: 'response has invalid data.decryptionProof (non-hex)',
        apiResponse: {
          ok: true,
          status: 200,
          data: { decryptionProof: 'foo' },
        },
      },
      {
        name: 'response has invalid data.decryptionProof length',
        apiResponse: {
          ok: true,
          status: 200,
          data: { decryptionProof: '0xabcd' },
        },
      },
      {
        name: 'response is not ok',
        apiResponse: {
          ok: false,
          status: 500,
          data: { error: 'Internal server error' },
        },
      },
    ];

    for (const { name, apiResponse } of testCases) {
      it(`should throw when ${name}`, async () => {
        mockApiService.get.mockResolvedValueOnce(apiResponse);
        await expect(
          publicDecrypt({
            handle: DUMMY_TYPED_HANDLES.bool,
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            subgraphService: mockSubgraphService,
            config: mockConfig,
          })
        ).rejects.toThrow(
          new Error(
            `Unexpected response from Handle Gateway (status: ${apiResponse.status}, data: ${JSON.stringify(apiResponse.data)})`
          )
        );
      });
    }

    it('should throw when decrypted plaintext is invalid', async () => {
      const boolHandle = DUMMY_TYPED_HANDLES.bool;
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          decryptionProof:
            DUMMY_DECRYPTION_PROOF_SIGNATURE +
            '0000000000000000000000000000000000000000000000000000000000000002', // invalid bool plaintext (0x02 instead of 0x00 or 0x01)
        },
      });
      await expect(
        publicDecrypt({
          handle: boolHandle,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          subgraphService: mockSubgraphService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `Failed to decode decrypted plaintext: expected hex encoded bool, got 0x0000000000000000000000000000000000000000000000000000000000000002`
        )
      );
    });
  });

  describe('required parameters validation', () => {
    it('rejects missing handle', async () => {
      await expect(
        publicDecrypt({
          // @ts-expect-error - Testing runtime validation of missing required params
          handle: undefined,
        })
      ).rejects.toThrow('Missing required parameters: handle');
    });
  });
});
