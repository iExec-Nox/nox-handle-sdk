import { BrowserProvider } from 'ethers';
import { describe, expect, it, vi } from 'vitest';
import type { HandleClientConfig } from '../../../src/index.js';
import { decrypt } from '../../../src/methods/decrypt.js';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import type { IStorageService } from '../../../src/services/storage/IStorageService.js';
import { InMemoryStorageService } from '../../../src/services/storage/InMemoryStorageService.js';
import { hexToBytes } from '../../../src/utils/hex.js';
import * as rsa from '../../../src/utils/rsa.js';
import { buildHandle, createMockEIP1193Provider } from '../../helpers/mocks.js';
import {
  DUMMY_TYPED_HANDLES,
  SUPPORTED_CHAIN_ID,
  TEST_ADDRESS,
  TEST_ENCRYPTED_DATA,
  TEST_PRIVATE_KEY,
  TEST_RSA_PKCS8_PRIV_KEY,
  TEST_RSA_SPKI_PUB_KEY,
} from '../../helpers/testData.js';

const REQUEST_SALT_MOCK =
  '0xabababababababababababababababababababababababababababababababab';

vi.mock('../../../src/utils/gatewayAttestation.js', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../../../src/utils/gatewayAttestation.js')
    >();
  return {
    ...actual,
    generateRequestSalt: vi.fn(() => REQUEST_SALT_MOCK),
    attestResponse: vi.fn(() => Promise.resolve()),
  };
});

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
    subgraphUrl: 'https://subgraph.example.com',
  };

  const mockStorageService: IStorageService = {
    // eslint-disable-next-line unicorn/no-null
    getItem: vi.fn().mockImplementation(() => null),
    setItem: vi.fn().mockImplementation(() => {}),
    removeItem: vi.fn().mockImplementation(() => {}),
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

  const signTypedDataSpy = vi.spyOn(mockBlockchainService, 'signTypedData');

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
        mockApiService.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          data: {
            encryptedSharedSecret: encryptedData.encryptedSharedSecret,
            iv: encryptedData.iv,
            ciphertext: encryptedData.ciphertext,
          },
        });
        const result = await decrypt({
          handle: dummyTypedHandle,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          storageService: mockStorageService,
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
      // Set mock to return false for isViewer
      mockProvider.mocks.call.mockResolvedValueOnce('0x00'.padEnd(66, '0')); // false
      const signTypedDataSpy = vi.spyOn(
        EthersBlockchainService.prototype,
        'signTypedData'
      );
      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          storageService: mockStorageService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `Handle (${DUMMY_TYPED_HANDLES.bool}) does not exist or user (${TEST_ADDRESS}) is not authorized to decrypt it`
        )
      );
      expect(signTypedDataSpy).not.toHaveBeenCalled();
      expect(mockApiService.get).not.toHaveBeenCalled();
    });
  });

  describe('when handle chain ID mismatches', () => {
    it('should throw', async () => {
      await expect(
        decrypt({
          handle: buildHandle({ chainId: SUPPORTED_CHAIN_ID + 1, typeCode: 0 }),
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          storageService: mockStorageService,
          config: mockConfig,
        })
      ).rejects.toThrow(
        new Error(
          `Handle chainId (${SUPPORTED_CHAIN_ID + 1}) does not match connected chainId (${SUPPORTED_CHAIN_ID})`
        )
      );
      expect(signTypedDataSpy).not.toHaveBeenCalled();
      expect(mockApiService.get).not.toHaveBeenCalled();
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
          apiService: mockApiService,
          storageService: mockStorageService,
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
          apiService: mockApiService,
          storageService: mockStorageService,
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
      signTypedDataSpy.mockImplementationOnce(() =>
        Promise.reject(new Error('User rejected signing request'))
      );
      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          storageService: mockStorageService,
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
        apiResponse: { ok: true, status: 500, data: { error: 'Oops!' } },
      },
      {
        name: 'response has missing data',
        apiResponse: { ok: true, status: 200 },
      },
      {
        name: 'response has missing data.ciphertext',
        apiResponse: {
          ok: true,
          status: 200,
          data: { iv, encryptedSharedSecret },
        },
      },
      {
        name: 'response has invalid data.ciphertext',
        apiResponse: {
          ok: true,
          status: 200,
          data: { iv, encryptedSharedSecret, ciphertext: 'foo' },
        },
      },
      {
        name: 'response has missing data.iv',
        apiResponse: {
          ok: true,
          status: 200,
          data: { ciphertext, encryptedSharedSecret },
        },
      },
      {
        name: 'response has invalid data.iv',
        apiResponse: {
          ok: true,
          status: 200,
          data: { iv: 'foo', encryptedSharedSecret, ciphertext },
        },
      },
      {
        name: 'response has missing data.encryptedSharedSecret',
        apiResponse: { ok: true, status: 200, data: { ciphertext, iv } },
      },
      {
        name: 'response has invalid data.encryptedSharedSecret',
        apiResponse: {
          ok: true,
          status: 200,
          data: { iv, encryptedSharedSecret: 'foo', ciphertext },
        },
      },
    ];

    for (const { name, apiResponse } of testCases) {
      it(`should throw when ${name}`, async () => {
        mockApiService.get.mockResolvedValueOnce(apiResponse);
        await expect(
          decrypt({
            handle: DUMMY_TYPED_HANDLES.bool,
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            storageService: mockStorageService,
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
      const { iv, ciphertext, encryptedSharedSecret } =
        TEST_ENCRYPTED_DATA.bool;
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { iv, ciphertext, encryptedSharedSecret },
      });
      // no mock to generate random RSA key pair that won't match the encrypted shared secret
      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          storageService: mockStorageService,
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
      const { iv, ciphertext, encryptedSharedSecret } =
        TEST_ENCRYPTED_DATA.bool;
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          iv,
          ciphertext: ciphertext.slice(0, -2) + '00', // Corrupt ciphertext to trigger decryption failure
          encryptedSharedSecret,
        },
      });
      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          storageService: mockStorageService,
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
        mockApiService.get.mockResolvedValueOnce({
          ok: true,
          status: 200,
          data: {
            encryptedSharedSecret: encryptedData.encryptedSharedSecret,
            iv: encryptedData.iv,
            ciphertext: encryptedData.ciphertext,
          },
        });

        await expect(
          decrypt({
            handle,
            blockchainService: mockBlockchainService,
            apiService: mockApiService,
            storageService: mockStorageService,
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

  describe('decryption material caching', () => {
    it('should store decryption material on successful decryption', async () => {
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
        generateRsaKeyPairMock
      );
      const storageService = new InMemoryStorageService();
      vi.spyOn(storageService, 'setItem');
      vi.spyOn(storageService, 'getItem');
      vi.spyOn(storageService, 'removeItem');
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret: TEST_ENCRYPTED_DATA.bool.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.bool.iv,
          ciphertext: TEST_ENCRYPTED_DATA.bool.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.bool,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });
      expect(storageService.setItem).toHaveBeenCalledTimes(1);
    });

    it('should reuse stored decryption material for subsequent decryptions', async () => {
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
        generateRsaKeyPairMock
      );
      const storageService = new InMemoryStorageService();
      vi.spyOn(storageService, 'setItem');
      vi.spyOn(storageService, 'getItem');
      vi.spyOn(storageService, 'removeItem');
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret: TEST_ENCRYPTED_DATA.bool.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.bool.iv,
          ciphertext: TEST_ENCRYPTED_DATA.bool.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.bool,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret:
            TEST_ENCRYPTED_DATA.bytes8.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.bytes8.iv,
          ciphertext: TEST_ENCRYPTED_DATA.bytes8.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.bytes8,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret:
            TEST_ENCRYPTED_DATA.uint256.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.uint256.iv,
          ciphertext: TEST_ENCRYPTED_DATA.uint256.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.uint256,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });
      expect(rsa.generateRsaKeyPair).toHaveBeenCalledTimes(1);
      expect(storageService.getItem).toHaveBeenCalledTimes(3);
    });

    it('should not store decryption material if it already exists', async () => {
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
        generateRsaKeyPairMock
      );
      const storageService = new InMemoryStorageService();
      vi.spyOn(storageService, 'setItem');
      vi.spyOn(storageService, 'getItem');
      vi.spyOn(storageService, 'removeItem');
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret: TEST_ENCRYPTED_DATA.bool.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.bool.iv,
          ciphertext: TEST_ENCRYPTED_DATA.bool.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.bool,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret:
            TEST_ENCRYPTED_DATA.uint256.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.uint256.iv,
          ciphertext: TEST_ENCRYPTED_DATA.uint256.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.uint256,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });
      expect(storageService.setItem).toHaveBeenCalledTimes(1);
    });

    it('should clear stored decryption material if retrieved authorization is malformed or outdated', async () => {
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
        generateRsaKeyPairMock
      );
      const storageService = new InMemoryStorageService();
      vi.spyOn(storageService, 'setItem');
      vi.spyOn(storageService, 'getItem').mockImplementationOnce(() => {
        const now = Math.floor(Date.now() / 1000);
        const json = JSON.stringify({
          payload: {
            notBefore: now - 60,
            expiresAt: now - 30, // already expired
          },
          signature: 'foo',
        });
        const authorization = `EIP712 ${btoa(json)}`;
        return JSON.stringify({
          authorization,
          pkcs8: TEST_RSA_PKCS8_PRIV_KEY,
        });
      });
      vi.spyOn(storageService, 'removeItem');
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret: TEST_ENCRYPTED_DATA.bool.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.bool.iv,
          ciphertext: TEST_ENCRYPTED_DATA.bool.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.bool,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });
      expect(storageService.removeItem).toHaveBeenCalledTimes(1);
    });

    it('should clear stored decryption material and retry with a new one if not accepted by the gateway', async () => {
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
        generateRsaKeyPairMock
      );
      const storageService = new InMemoryStorageService();
      vi.spyOn(storageService, 'setItem');
      vi.spyOn(storageService, 'getItem').mockImplementationOnce(() => {
        const now = Math.floor(Date.now() / 1000);
        const json = JSON.stringify({
          payload: {
            notBefore: now - 60,
            expiresAt: now + 300, // valid for the next 5 minutes
          },
          signature: '0x',
        });
        const authorization = `EIP712 ${btoa(json)}`;
        return JSON.stringify({
          authorization,
          pkcs8: TEST_RSA_PKCS8_PRIV_KEY,
        });
      });
      vi.spyOn(storageService, 'removeItem');
      mockApiService.get.mockResolvedValueOnce({
        ok: false,
        status: 401,
        data: { error: 'Unauthorized' },
      });
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret: TEST_ENCRYPTED_DATA.bool.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.bool.iv,
          ciphertext: TEST_ENCRYPTED_DATA.bool.ciphertext,
        },
      });
      await decrypt({
        handle: DUMMY_TYPED_HANDLES.bool,
        blockchainService: mockBlockchainService,
        apiService: mockApiService,
        storageService: storageService,
        config: mockConfig,
      });

      expect(mockApiService.get).toHaveBeenCalledTimes(2);
      expect(storageService.removeItem).toHaveBeenCalledTimes(1);
      expect(rsa.generateRsaKeyPair).toHaveBeenCalledTimes(1);
      expect(storageService.setItem).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from storage service gracefully', async () => {
      const failingStorageService: IStorageService = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage getItem error');
        }),
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage setItem error');
        }),
        removeItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage removeItem error');
        }),
      };
      vi.spyOn(rsa, 'generateRsaKeyPair').mockImplementationOnce(
        generateRsaKeyPairMock
      );
      mockApiService.get.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          encryptedSharedSecret: TEST_ENCRYPTED_DATA.bool.encryptedSharedSecret,
          iv: TEST_ENCRYPTED_DATA.bool.iv,
          ciphertext: TEST_ENCRYPTED_DATA.bool.ciphertext,
        },
      });
      await expect(
        decrypt({
          handle: DUMMY_TYPED_HANDLES.bool,
          blockchainService: mockBlockchainService,
          apiService: mockApiService,
          storageService: failingStorageService,
          config: mockConfig,
        })
      ).resolves.toStrictEqual({
        value: TEST_ENCRYPTED_DATA.bool.value,
        solidityType: 'bool',
      });
      expect(failingStorageService.getItem).toHaveBeenCalledTimes(1);
      expect(failingStorageService.setItem).toHaveBeenCalledTimes(1);
    });
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
