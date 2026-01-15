import { describe, expect, it } from 'vitest';

import { Wallet, BrowserProvider } from 'ethers';
import {
  createMockEIP1193Provider,
  createMockProvider,
  EIP712_TYPED_DATA_MOCK,
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from '../../../helpers/mocks.js';
import { EthersBlockchainService } from '../../../../src/services/blockchain/EthersBlockchainService.js';

describe('EthersBlockchainService', () => {
  const testCases = [
    {
      name: 'AbstractSigner',
      client: new Wallet(TEST_PRIVATE_KEY, createMockProvider(1)),
    },
    {
      name: 'BrowserProvider',
      client: new BrowserProvider(createMockEIP1193Provider(1)),
    },
  ];

  for (const { name, client } of testCases) {
    describe(`with ${name}`, () => {
      const blockchainService = new EthersBlockchainService(client);

      describe('getChainId', () => {
        it('should return the correct chainId', async () => {
          const chainId = await blockchainService.getChainId();
          expect(chainId).toBe(1);
        });
      });

      describe('getAddress', () => {
        it('should return the correct address', async () => {
          const address = await blockchainService.getAddress();
          expect(address).toBe(TEST_ADDRESS);
        });
      });

      describe('signTypedData', () => {
        it('should sign typed data correctly', async () => {
          const signature = await blockchainService.signTypedData(
            EIP712_TYPED_DATA_MOCK
          );
          expect(signature).toMatch(/0x[a-fA-F0-9]{130}/);
        });
      });
    });
  }
});
