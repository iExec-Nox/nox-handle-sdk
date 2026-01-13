import { describe, expect, it } from 'vitest';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import {
  createMockEIP1193Provider,
  createMockProvider,
  EIP712_TYPED_DATA_MOCK,
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from '../../helpers/mocks.js';
import { Wallet, BrowserProvider } from 'ethers';

describe('EthersBlockchainService', () => {
  describe('with AbstractSigner', () => {
    const signer = new Wallet(TEST_PRIVATE_KEY, createMockProvider(1));

    describe('getChainId', () => {
      it('should return the correct chainId', async () => {
        const ethersBlockchainService = new EthersBlockchainService(signer);
        const chainId = await ethersBlockchainService.getChainId();
        expect(chainId).toBe(1);
      });
    });

    describe('getAddress', () => {
      it('should return the correct address', async () => {
        const ethersBlockchainService = new EthersBlockchainService(signer);
        const address = await ethersBlockchainService.getAddress();
        expect(address).toBe(TEST_ADDRESS);
      });
    });

    describe('signTypedData', () => {
      it('should sign typed data correctly', async () => {
        const ethersBlockchainService = new EthersBlockchainService(signer);
        const signature = await ethersBlockchainService.signTypedData(
          EIP712_TYPED_DATA_MOCK
        );
        expect(signature).toMatch(/0x[a-fA-F0-9]{130}/);
      });
    });
  });

  describe('with BrowserProvider', () => {
    const browserProvider = new BrowserProvider(createMockEIP1193Provider(1));

    describe('getChainId', () => {
      it('should return the correct chainId', async () => {
        const ethersBlockchainService = new EthersBlockchainService(
          browserProvider
        );
        const chainId = await ethersBlockchainService.getChainId();
        expect(chainId).toBe(1);
      });
    });

    describe('getAddress', () => {
      it('should return the correct address', async () => {
        const ethersBlockchainService = new EthersBlockchainService(
          browserProvider
        );
        const address = await ethersBlockchainService.getAddress();
        expect(address).toBe(TEST_ADDRESS);
      });
    });

    describe('signTypedData', () => {
      it('should sign typed data correctly', async () => {
        const ethersBlockchainService = new EthersBlockchainService(
          browserProvider
        );
        const signature = await ethersBlockchainService.signTypedData(
          EIP712_TYPED_DATA_MOCK
        );
        expect(signature).toMatch(/0x[a-fA-F0-9]{130}/);
      });
    });
  });
});
