import { describe, expect, it, vi } from 'vitest';
import { BrowserProvider } from 'ethers';
import { decrypt } from '../../../src/methods/decrypt.js';
import { buildHandle, createMockEIP1193Provider } from '../../helpers/mocks.js';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import type { IApiService } from '../../../src/services/api/IApiService.js';
import * as rsa from '../../../src/utils/rsa.js';
import { hexToBytes } from '../../../src/utils/hex.js';
import {
  DUMMY_TYPED_HANDLES,
  SUPPORTED_CHAIN_ID,
  TEST_ADDRESS,
  TEST_ENCRYPTED_DATA,
  TEST_PRIVATE_KEY,
  TEST_RSA_PKCS8_PRIV_KEY,
  TEST_RSA_SPKI_PUB_KEY,
} from '../../helpers/testData.js';
import type { HandleClientConfig } from '../../../src/index.js';

async function generateRsaKeyPairMock() {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    hexToBytes(TEST_RSA_PKCS8_PRIV_KEY),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
  const publicKey = await crypto.subtle.importKey(
    'spki',
    hexToBytes(TEST_RSA_SPKI_PUB_KEY),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
  return { publicKey, privateKey };
}

describe('decrypt', () => {
  const mockProvider = createMockEIP1193Provider(
    SUPPORTED_CHAIN_ID,
    TEST_PRIVATE_KEY
  );

  const mockConfig: HandleClientConfig = {
    gatewayUrl: 'https://example.com',
    smartContractAddress: '0x0000000000000000000000000000000000000000',
  };

  const mockBlockchainService = new EthersBlockchainService(
    new BrowserProvider(mockProvider)
  );

  // by default, mock isViewer to return true
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
        vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
          generateRsaKeyPairMock
        );

        const result = await decrypt({
          handle: dummyTypedHandle,
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { encryptedSharedSecret, iv, ciphertext } = encryptedData;
              return {
                status: 200,
                data: { encryptedSharedSecret, iv, ciphertext },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        });
        expect(result).toStrictEqual({
          value: encryptedData.value,
          solidityType,
        });
      });
    }
  });

  describe('when user is not authorized', () => {
    it('should throw', async () => {
      // Reset mock to return false for isViewer
      mockProvider.mocks.call.mockResolvedValueOnce('0x00'.padEnd(66, '0')); // false

      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { iv, ciphertext, encryptedSharedSecret } =
                TEST_ENCRYPTED_DATA.bool;
              return {
                status: 200,
                data: { iv, encryptedSharedSecret, ciphertext },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `User (${TEST_ADDRESS}) is not authorized to decrypt the handle`
        )
      );
    });
  });

  describe('when handle chain ID mismatches', () => {
    it('should throw', async () => {
      await expect(
        decrypt({
          handle: buildHandle({ chainId: SUPPORTED_CHAIN_ID + 1, typeCode: 0 }),
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { iv, ciphertext, encryptedSharedSecret } =
                TEST_ENCRYPTED_DATA.bool;
              return {
                status: 200,
                data: { iv, encryptedSharedSecret, ciphertext },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `Handle chainId (${SUPPORTED_CHAIN_ID + 1}) does not match connected chainId (${SUPPORTED_CHAIN_ID})`
        )
      );
    });
  });

  describe('when RSA key generation fails', () => {
    it('should throw', async () => {
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(() =>
        Promise.reject(new Error('RSA key generation error'))
      );

      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { iv, ciphertext, encryptedSharedSecret } =
                TEST_ENCRYPTED_DATA.bool;
              return {
                status: 200,
                data: { iv, encryptedSharedSecret, ciphertext },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error('Failed to generate RSA key pair', {
          cause: new Error('RSA key generation error'),
        })
      );
    });
  });

  describe('when RSA public key export fails', () => {
    it('should throw', async () => {
      vi.spyOn(rsa, 'exportRsaPublicKey').mockImplementationOnce(() =>
        Promise.reject(new Error('RSA public key export error'))
      );

      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { iv, ciphertext, encryptedSharedSecret } =
                TEST_ENCRYPTED_DATA.bool;
              return {
                status: 200,
                data: { iv, encryptedSharedSecret, ciphertext },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error('Failed to export RSA public key', {
          cause: new Error('RSA public key export error'),
        })
      );
    });
  });

  describe('when data access signature fails', () => {
    it('should throw', async () => {
      vi.spyOn(
        EthersBlockchainService.prototype,
        'signTypedData'
      ).mockImplementationOnce(() =>
        Promise.reject(new Error('User rejected signing request'))
      );

      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { iv, ciphertext, encryptedSharedSecret } =
                TEST_ENCRYPTED_DATA.bool;
              return {
                status: 200,
                data: { iv, encryptedSharedSecret, ciphertext },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error('Failed to sign data access authorization', {
          cause: new Error('User rejected signing request'),
        })
      );
    });
  });

  describe('when handle gateway returns unexpected data', () => {
    const { iv, ciphertext, encryptedSharedSecret } = TEST_ENCRYPTED_DATA.bool;
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
        name: 'response has missing data.ciphertext',
        apiResponse: { status: 200, data: { iv, encryptedSharedSecret } },
      },
      {
        name: 'response has invalid data.ciphertext',
        apiResponse: {
          status: 200,
          data: { iv, encryptedSharedSecret, ciphertext: 'foo' },
        },
      },
      {
        name: 'response has missing data.iv',
        apiResponse: {
          status: 200,
          data: { ciphertext, encryptedSharedSecret },
        },
      },
      {
        name: 'response has invalid data.iv',
        apiResponse: {
          status: 200,
          data: { iv: 'foo', encryptedSharedSecret, ciphertext },
        },
      },
      {
        name: 'response has missing data.encryptedSharedSecret',
        apiResponse: { status: 200, data: { ciphertext, iv } },
      },
      {
        name: 'response has invalid data.encryptedSharedSecret',
        apiResponse: {
          status: 200,
          data: { iv, encryptedSharedSecret: 'foo', ciphertext },
        },
      },
    ];

    for (const { name, apiResponse } of testCases) {
      it(`should throw when ${name}`, async () => {
        await expect(
          decrypt({
            handle: DUMMY_TYPED_HANDLES.bool,
            blockchainService: mockBlockchainService,
            apiService: {
              get: async () => {
                return apiResponse;
              },
            } as unknown as IApiService,
            config: mockConfig,
          })
        ).rejects.toThrow(
          new Error(
            `Unexpected response from Handle Gateway (status: ${apiResponse.status}, data: ${JSON.stringify(apiResponse.data)})`
          )
        );
      });
    }
  });

  describe('when RSA decryption of shared secret fails', () => {
    it('should throw', async () => {
      // no mock to generate random RSA key pair that won't match the encrypted shared secret
      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { iv, ciphertext, encryptedSharedSecret } =
                TEST_ENCRYPTED_DATA.bool;
              return {
                status: 200,
                data: {
                  iv,
                  encryptedSharedSecret,
                  ciphertext,
                },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error('Failed to decrypt shared secret', {
          cause: expect.any(Error),
        })
      );
    });
  });

  describe('when ECIES decryption of ciphertext fails', () => {
    it('should throw', async () => {
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
        generateRsaKeyPairMock
      );
      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: {
            get: async () => {
              const { iv, encryptedSharedSecret } = TEST_ENCRYPTED_DATA.bool;
              return {
                status: 200,
                data: {
                  iv,
                  encryptedSharedSecret,
                  ciphertext:
                    TEST_ENCRYPTED_DATA.bool.ciphertext.slice(0, -2) + '00', // Corrupt ciphertext to trigger decryption failure
                },
              };
            },
          } as unknown as IApiService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error('Failed to decrypt ciphertext', {
          cause: expect.any(Error),
        })
      );
    });
  });

  describe('when decrypted data type mismatch handle type', () => {
    const testCases = [
      {
        solidityType: 'address',
        handle: DUMMY_TYPED_HANDLES.address,
        encryptedData: TEST_ENCRYPTED_DATA.bool,
      },
      {
        solidityType: 'bytes16',
        handle: DUMMY_TYPED_HANDLES.bytes16,
        encryptedData: TEST_ENCRYPTED_DATA.bool,
      },
    ];

    for (const { solidityType, encryptedData, handle } of testCases) {
      it(`should throw for invalid plaintext for ${solidityType}`, async () => {
        vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
          generateRsaKeyPairMock
        );

        await expect(
          decrypt({
            handle,
            blockchainService: mockBlockchainService,
            apiService: {
              get: async () => {
                const { iv, encryptedSharedSecret, ciphertext } = encryptedData;
                return {
                  status: 200,
                  data: { iv, encryptedSharedSecret, ciphertext },
                };
              },
            } as unknown as IApiService,
            config: mockConfig,
          })
        ).rejects.toThrow(
          new Error(
            `Failed to decode decrypted plaintext: expected hex encoded ${solidityType}, got ${encryptedData.plaintext}`
          )
        );
      });
    }
  });
  describe('required parameters validation', () => {
    it('rejects missing handle', async () => {
      await expect(
        decrypt({
          // @ts-expect-error - Testing runtime validation of missing required params
          handle: undefined,
        })
      ).rejects.toThrow('Missing required parameters: handle');
    });
  });
});
