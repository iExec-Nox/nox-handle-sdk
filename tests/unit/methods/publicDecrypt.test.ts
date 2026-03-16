import { BrowserProvider } from 'ethers';
import { describe, expect, it, vi } from 'vitest';
import type { HandleClientConfig } from '../../../src/index.js';
import { publicDecrypt } from '../../../src/methods/publicDecrypt.js';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import { buildHandle, createMockEIP1193Provider } from '../../helpers/mocks.js';
import {
  DUMMY_DECRYPTION_PROOF_SIGNATURE,
  DUMMY_TYPED_HANDLES,
  SUPPORTED_CHAIN_ID,
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
          status: 200,
          data: {
            decryptionProof:
              DUMMY_DECRYPTION_PROOF_SIGNATURE + encryptedData.packedPlaintext,
          },
        });
        const result = await publicDecrypt({
          handle: dummyTypedHandle,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          config: mockConfig,
        });
        expect(result).toStrictEqual({
          value: encryptedData.value,
          solidityType,
          decryptionProof:
            DUMMY_DECRYPTION_PROOF_SIGNATURE + encryptedData.packedPlaintext,
        });
      });
    }
  });

  describe('when user is not authorized', () => {
    it('should throw', async () => {
      // Set mock to return false for isPubliclyDecryptable
      mockProvider.mocks.call.mockResolvedValueOnce('0x00'.padEnd(66, '0')); // false
      await expect(
        publicDecrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
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
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `Handle chainId (${SUPPORTED_CHAIN_ID + 1}) does not match connected chainId (${SUPPORTED_CHAIN_ID})`
        )
      );
      expect(mockApiService.get).not.toHaveBeenCalled();
    });
  });

  describe('when handle gateway returns unexpected data', () => {
    const testCases = [
      {
        name: 'response has non-200 status',
        apiResponse: { status: 500, data: { error: 'Oops!' } },
      },
      {
        name: 'response has missing data',
        apiResponse: { status: 200 },
      },
      {
        name: 'response has missing data.decryptionProof',
        apiResponse: {
          status: 200,
          data: {},
        },
      },
      {
        name: 'response has invalid data.decryptionProof (non-hex)',
        apiResponse: {
          status: 200,
          data: { decryptionProof: 'foo' },
        },
      },
      {
        name: 'response has invalid data.decryptionProof length',
        apiResponse: {
          status: 200,
          data: { decryptionProof: '0xabcd' },
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
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `Failed to decode decrypted plaintext: expected packed bool, got 0x0000000000000000000000000000000000000000000000000000000000000002`
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
