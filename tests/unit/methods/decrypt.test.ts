import { describe, expect, it, vi } from 'vitest';
import { decrypt } from '../../../src/methods/decrypt.js';
import { BrowserProvider } from 'ethers';
import {
  createMockEIP1193Provider,
  DUMMY_TYPED_HANDLES,
  TEST_ENCRYPTED_DATA,
  TEST_RSA_PKCS8_PRIV_KEY,
  TEST_RSA_SPKI_PUB_KEY,
} from '../../helpers/mocks.js';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import type { IApiService } from '../../../src/services/api/IApiService.js';
import * as rsa from '../../../src/utils/rsa.js';
import { hexToBytes } from '../../../src/utils/hex.js';

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
        blockchainService: new EthersBlockchainService(
          new BrowserProvider(createMockEIP1193Provider(1))
        ),
        apiService: {
          get: async () => {
            const { encryptedSharedSecret, iv, ciphertext } = encryptedData;
            return {
              status: 200,
              data: { encryptedSharedSecret, iv, ciphertext },
            };
          },
        } as unknown as IApiService,
        config: {
          gatewayUrl: 'https://example.com',
          smartContractAddress: '0x0000000000000000000000000000000000000000',
        },
      });
      expect(result).toStrictEqual({
        value: encryptedData.value,
        solidityType,
      });
    });
  }
});
