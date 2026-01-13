import { it, describe, expect } from 'vitest';
import { createViemHandleClient } from '../../../src/factories/createViemHandleClient.js';
import { ViemBlockchainService } from '../../../src/services/blockchain/ViemBlockchainService.js';
import { NETWORK_CONFIGS } from '../../../src/config/networks.js';
import {
  SUPPORTED_CHAIN_ID,
  UNSUPPORTED_CHAIN_ID,
  createMockEIP1193Provider,
} from '../../helpers/mocks.js';
import { createWalletClient, custom } from 'viem';

describe('createViemHandleClient', () => {
  describe('with an invalid client', () => {
    it('should throw an error', async () => {
      const invalidClient = {} as never;

      await expect(createViemHandleClient(invalidClient)).rejects.toThrow(
        new TypeError(
          'Unsupported client. Expected a viem WalletClient instance connected to an account.'
        )
      );
    });
  });

  describe('with a ViemClient', () => {
    describe('with a supported chainId', () => {
      const viemClient = createWalletClient({
        transport: custom(createMockEIP1193Provider(SUPPORTED_CHAIN_ID)),
      });

      it('should create a HandleClient instance with a blockchainService of type ViemBlockchainService', async () => {
        const viemHandleClient = await createViemHandleClient(viemClient);

        expect(viemHandleClient).toBeDefined();
        expect(viemHandleClient['blockchainService']).toBeInstanceOf(
          ViemBlockchainService
        );
      });

      it('should resolve config from supported chainId', async () => {
        const handleClient = await createViemHandleClient(viemClient);

        expect(handleClient.getGatewayUrl()).toBe(
          NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.gatewayUrl
        );
        expect(handleClient.getSmartContractAddress()).toBe(
          NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.smartContractAddress
        );
      });

      it('should use override values when provided', async () => {
        const handleClient = await createViemHandleClient(viemClient, {
          gatewayUrl: 'https://custom-gateway.com',
        });

        expect(handleClient.getGatewayUrl()).toBe('https://custom-gateway.com');
        expect(handleClient.getSmartContractAddress()).toBe(
          NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.smartContractAddress
        );
      });
    });

    describe('with an unsupported chainId', () => {
      const viemClient = createWalletClient({
        transport: custom(createMockEIP1193Provider(UNSUPPORTED_CHAIN_ID)),
      });
      it('should throw if chainId not supported and no config provided', async () => {
        await expect(createViemHandleClient(viemClient)).rejects.toThrow(
          new Error(
            'Chain 999999 is not supported. Supported chains: 42161, 421614. To use an unsupported chain, provide both gatewayUrl and smartContractAddress.'
          )
        );
      });

      it('should work with complete config on unsupported chainId', async () => {
        const handleClient = await createViemHandleClient(viemClient, {
          gatewayUrl: 'https://my-custom-gateway.com',
          smartContractAddress: '0x1234567890123456789012345678901234567890',
        });

        expect(handleClient.getGatewayUrl()).toBe(
          'https://my-custom-gateway.com'
        );
        expect(handleClient.getSmartContractAddress()).toBe(
          '0x1234567890123456789012345678901234567890'
        );
      });

      it('should throw with partial config on unsupported chainId', async () => {
        await expect(
          createViemHandleClient(viemClient, {
            gatewayUrl: 'https://partial.com',
          })
        ).rejects.toThrow(
          new Error(
            'Chain 999999 is not supported. Supported chains: 42161, 421614. To use an unsupported chain, provide both gatewayUrl and smartContractAddress.'
          )
        );
      });
    });
  });
});
