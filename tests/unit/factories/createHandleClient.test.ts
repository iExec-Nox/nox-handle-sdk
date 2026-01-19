import { it, describe, expect } from 'vitest';
import { Wallet } from 'ethers';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import { createHandleClient } from '../../../src/factories/createHandleClient.js';
import { ViemBlockchainService } from '../../../src/services/blockchain/ViemBlockchainService.js';
import { NETWORK_CONFIGS } from '../../../src/config/networks.js';
import {
  TEST_PRIVATE_KEY,
  SUPPORTED_CHAIN_ID,
  UNSUPPORTED_CHAIN_ID,
  createMockProvider,
  createMockEIP1193Provider,
} from '../../helpers/mocks.js';
import { createWalletClient, custom } from 'viem';

describe('createHandleClient', () => {
  describe('with an invalid client', () => {
    it('should throw an error', async () => {
      const invalidClient = {} as never;

      await expect(createHandleClient(invalidClient)).rejects.toThrow(
        new TypeError(
          'Unsupported blockchain client. Expected either an ethers AbstractSigner with connected provider or a viem WalletClient connected to an account.'
        )
      );
    });
  });

  describe('with an EthersClient', () => {
    const ethersClient = new Wallet(
      TEST_PRIVATE_KEY,
      createMockProvider(SUPPORTED_CHAIN_ID)
    );
    it('should create a HandleClient instance with a blockchainService of type EthersBlockchainService', async () => {
      const ethersHandleClient = await createHandleClient(ethersClient);

      expect(ethersHandleClient).toBeDefined();
      expect(ethersHandleClient['blockchainService']).toBeInstanceOf(
        EthersBlockchainService
      );
    });
  });

  describe('with a ViemClient', () => {
    const viemClient = createWalletClient({
      transport: custom(createMockEIP1193Provider(SUPPORTED_CHAIN_ID)),
    });

    it('should create a HandleClient instance with a blockchainService of type ViemBlockchainService', async () => {
      const viemHandleClient = await createHandleClient(viemClient);

      expect(viemHandleClient).toBeDefined();
      expect(viemHandleClient['blockchainService']).toBeInstanceOf(
        ViemBlockchainService
      );
    });

    it('should resolve config from network defaults', async () => {
      const handleClient = await createHandleClient(viemClient);

      expect(handleClient['config'].gatewayUrl).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.gatewayUrl
      );
      expect(handleClient['config'].smartContractAddress).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.smartContractAddress
      );
    });

    it('should throw if chainId not supported and no config provided', async () => {
      const viemClient = createWalletClient({
        transport: custom(createMockEIP1193Provider(UNSUPPORTED_CHAIN_ID)),
      });

      await expect(createHandleClient(viemClient)).rejects.toThrow(
        new Error(
          'Chain 999999 is not supported. Supported chains: 42161, 421614. To use an unsupported chain, provide both gatewayUrl and smartContractAddress.'
        )
      );
    });
  });
});
