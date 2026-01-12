import { it, describe, expect } from 'vitest';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createViemHandleClient } from '../../../src/factories/createViemHandleClient.js';
import { ViemBlockchainService } from '../../../src/services/blockchain/ViemBlockchainService.js';

describe('createViemHandleClient', () => {
  describe('with a ViemClient', () => {
    it('should create a HandleClient instance with a blockchainService of type ViemBlockchainService', async () => {
      const viemClient = createWalletClient({
        account: privateKeyToAccount(
          '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1'
        ),
        transport: http('http://localhost:8545'),
      });

      const viemHandleClient = createViemHandleClient(viemClient);
      expect(viemHandleClient).toBeDefined();
      expect(typeof viemHandleClient).toBe('object');
      expect(viemHandleClient['blockchainService']).toBeInstanceOf(
        ViemBlockchainService
      );
    });
  });

  describe('with an invalid client', () => {
    it('should throw an error', () => {
      const invalidClient = {} as never;
      expect(() => createViemHandleClient(invalidClient)).toThrowError(
        new TypeError(
          'Unsupported client. Expected a viem WalletClient instance connected to an account.'
        )
      );
    });
  });
});
