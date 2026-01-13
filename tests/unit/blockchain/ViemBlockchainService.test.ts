import { describe, expect, it } from 'vitest';
import { createWalletClient, custom } from 'viem';
import {
  createMockEIP1193Provider,
  EIP712_TYPED_DATA_MOCK,
  TEST_ADDRESS,
} from '../../helpers/mocks.js';
import { ViemBlockchainService } from '../../../src/services/blockchain/ViemBlockchainService.js';

describe('ViemBlockchainService', () => {
  describe('with a EIP-1193 provider', () => {
    const client = createWalletClient({
      transport: custom(createMockEIP1193Provider(1)),
    });

    describe('getChainId', () => {
      it('should return the correct chainId', async () => {
        const viemBlockchainService = new ViemBlockchainService(client);
        const chainId = await viemBlockchainService.getChainId();
        expect(chainId).toBe(1);
      });
    });

    describe('getAddress', () => {
      it('should return the correct address', async () => {
        const viemBlockchainService = new ViemBlockchainService(client);
        const address = await viemBlockchainService.getAddress();
        expect(address).toBe(TEST_ADDRESS);
      });
    });

    describe('signTypedData', () => {
      it('should sign typed data correctly', async () => {
        const viemBlockchainService = new ViemBlockchainService(client);
        const signature = await viemBlockchainService.signTypedData(
          EIP712_TYPED_DATA_MOCK
        );
        expect(signature).toMatch(/0x[a-fA-F0-9]{130}/);
      });
    });
  });
});
