import { it, describe, expect } from 'vitest';
import { Wallet, JsonRpcProvider } from 'ethers';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import { createHandleClient } from '../../../src/factories/createHandleClient.js';
import { ViemBlockchainService } from '../../../src/services/blockchain/ViemBlockchainService.js';

describe('createHandleClient', () => {
  describe('with an EthersClient', () => {
    it('should create a HandleClient instance with a blockchainService of type EthersBlockchainService', async () => {
      const ethersClient = new Wallet(
        '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1',
        new JsonRpcProvider('http://localhost:8545')
      );
      const ethersHandleClient = createHandleClient(ethersClient);
      expect(ethersHandleClient).toBeDefined();
      expect(typeof ethersHandleClient).toBe('object');
      expect(ethersHandleClient['blockchainService']).toBeInstanceOf(
        EthersBlockchainService
      );
    });
  });

  describe('with a ViemClient', () => {
    it('should create a HandleClient instance with a blockchainService of type ViemBlockchainService', async () => {
      const viemClient = createWalletClient({
        account: privateKeyToAccount(
          '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1'
        ),
        transport: http('http://localhost:8545'),
      });
      const viemHandleClient = createHandleClient(viemClient);
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
      expect(() => createHandleClient(invalidClient)).toThrowError(
        new TypeError(
          'Unsupported blockchain client. Expected either an ethers AbstractSigner with connected provider or a viem WalletClient connected to an account.'
        )
      );
    });
  });
});
