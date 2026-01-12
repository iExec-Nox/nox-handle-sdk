import { it, describe, expect } from 'vitest';
import { Wallet } from 'ethers';
import { EthersBlockchainService } from '../../../src/services/blockchain/EthersBlockchainService.js';
import { createHandleClient } from '../../../src/factories/createHandleClient.js';
import type { BlockchainClient } from '../../../src/factories/createHandleClient.js';
import { ViemBlockchainService } from '../../../src/services/blockchain/ViemBlockchainService.js';
import { NETWORK_ENDPOINTS } from '../../../src/config/networks.js';
import {
  TEST_PRIVATE_KEY,
  SUPPORTED_CHAIN_ID,
  UNSUPPORTED_CHAIN_ID,
  createMockProvider,
  createMockViemClient,
} from '../../helpers/mocks.js';

describe('createHandleClient', () => {
  describe('with an EthersClient', () => {
    it('should create a HandleClient instance with a blockchainService of type EthersBlockchainService', async () => {
      const ethersClient = new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(SUPPORTED_CHAIN_ID)
      );

      const ethersHandleClient = await createHandleClient(ethersClient);

      expect(ethersHandleClient).toBeDefined();
      expect(ethersHandleClient['blockchainService']).toBeInstanceOf(
        EthersBlockchainService
      );
    });
  });

  describe('with a ViemClient', () => {
    it('should create a HandleClient instance with a blockchainService of type ViemBlockchainService', async () => {
      const viemClient = createMockViemClient(
        SUPPORTED_CHAIN_ID
      ) as BlockchainClient;

      const viemHandleClient = await createHandleClient(viemClient);

      expect(viemHandleClient).toBeDefined();
      expect(viemHandleClient['blockchainService']).toBeInstanceOf(
        ViemBlockchainService
      );
    });
  });

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

  describe('config resolution', () => {
    it('should resolve config from network defaults', async () => {
      const viemClient = createMockViemClient(
        SUPPORTED_CHAIN_ID
      ) as BlockchainClient;

      const handleClient = await createHandleClient(viemClient);

      expect(handleClient.getGatewayUrl()).toBe(
        NETWORK_ENDPOINTS[SUPPORTED_CHAIN_ID]?.gatewayUrl
      );
      expect(handleClient.getSmartContractAddress()).toBe(
        NETWORK_ENDPOINTS[SUPPORTED_CHAIN_ID]?.smartContractAddress
      );
    });

    it('should throw if chainId not supported and no config provided', async () => {
      const viemClient = createMockViemClient(
        UNSUPPORTED_CHAIN_ID
      ) as BlockchainClient;

      await expect(createHandleClient(viemClient)).rejects.toThrow(
        /Chain 999999 is not supported/
      );
    });
  });
});
