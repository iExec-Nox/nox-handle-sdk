import { it, describe, expect } from 'vitest';
import { Wallet } from 'ethers';
import { createEthersHandleClient } from '../../../src/factories/createEthersHandleClient.js';
import {
  BrowserProviderAdapter,
  EthersBlockchainService,
  SignerAdapter,
} from '../../../src/services/blockchain/EthersBlockchainService.js';
import { NETWORK_CONFIGS } from '../../../src/config/networks.js';
import {
  TEST_PRIVATE_KEY,
  SUPPORTED_CHAIN_ID,
  UNSUPPORTED_CHAIN_ID,
  createMockProvider,
  createMockEIP1193Provider,
} from '../../helpers/mocks.js';
import { BrowserProvider } from 'ethers';

describe('createEthersHandleClient', () => {
  describe('with an AbstractSigner connected to a provider', () => {
    it('should create a HandleClient instance with a blockchainService of type EthersBlockchainService and a SignerAdapter', async () => {
      const ethersClient = new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(SUPPORTED_CHAIN_ID)
      );

      const ethersHandleClient = await createEthersHandleClient(ethersClient);

      expect(ethersHandleClient).toBeDefined();
      expect(ethersHandleClient['blockchainService']).toBeInstanceOf(
        EthersBlockchainService
      );
      expect(
        (ethersHandleClient['blockchainService'] as EthersBlockchainService)[
          'adapter'
        ]
      ).toBeInstanceOf(SignerAdapter);
    });
  });

  describe('with a BrowserProvider', () => {
    const browserProvider = new BrowserProvider(
      createMockEIP1193Provider(SUPPORTED_CHAIN_ID)
    );
    it('should create a HandleClient instance with a blockchainService of type EthersBlockchainService and a BrowserProviderAdapter', async () => {
      const ethersHandleClient =
        await createEthersHandleClient(browserProvider);

      expect(ethersHandleClient).toBeDefined();
      expect(ethersHandleClient['blockchainService']).toBeInstanceOf(
        EthersBlockchainService
      );
      expect(
        (ethersHandleClient['blockchainService'] as EthersBlockchainService)[
          'adapter'
        ]
      ).toBeInstanceOf(BrowserProviderAdapter);
    });
  });

  describe('with an AbstractSigner NOT connected to a provider', () => {
    it('should throw an error', async () => {
      const ethersClient = new Wallet(TEST_PRIVATE_KEY);

      await expect(createEthersHandleClient(ethersClient)).rejects.toThrow(
        new TypeError(
          'Unsupported client. Expected an ethers AbstractSigner instance connected to a Provider or a BrowserProvider.'
        )
      );
    });
  });

  describe('with an invalid client', () => {
    it('should throw an error', async () => {
      const invalidClient = {} as never;

      await expect(createEthersHandleClient(invalidClient)).rejects.toThrow(
        new TypeError(
          'Unsupported client. Expected an ethers AbstractSigner instance connected to a Provider or a BrowserProvider.'
        )
      );
    });
  });

  describe('config resolution', () => {
    it('should resolve config from supported chainId', async () => {
      const ethersClient = new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(SUPPORTED_CHAIN_ID)
      );

      const handleClient = await createEthersHandleClient(ethersClient);

      expect(handleClient['config'].gatewayUrl).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.gatewayUrl
      );
      expect(handleClient['config'].smartContractAddress).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.smartContractAddress
      );
    });

    it('should use override values when provided', async () => {
      const ethersClient = new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(SUPPORTED_CHAIN_ID)
      );

      const handleClient = await createEthersHandleClient(ethersClient, {
        gatewayUrl: 'https://custom-gateway.com',
      });

      expect(handleClient['config'].gatewayUrl).toBe(
        'https://custom-gateway.com'
      );
      expect(handleClient['config'].smartContractAddress).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.smartContractAddress
      );
    });

    it('should throw if chainId not supported and no config provided', async () => {
      const ethersClient = new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(UNSUPPORTED_CHAIN_ID)
      );

      await expect(createEthersHandleClient(ethersClient)).rejects.toThrow(
        new Error(
          'Chain 999999 is not supported. Supported chains: 42161, 421614. To use an unsupported chain, provide both gatewayUrl and smartContractAddress.'
        )
      );
    });

    it('should work with complete config on unsupported chainId', async () => {
      const ethersClient = new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(UNSUPPORTED_CHAIN_ID)
      );

      const handleClient = await createEthersHandleClient(ethersClient, {
        gatewayUrl: 'https://my-custom-gateway.com',
        smartContractAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(handleClient['config'].gatewayUrl).toBe(
        'https://my-custom-gateway.com'
      );
      expect(handleClient['config'].smartContractAddress).toBe(
        '0x1234567890123456789012345678901234567890'
      );
    });

    it('should throw with partial config on unsupported chainId', async () => {
      const ethersClient = new Wallet(
        TEST_PRIVATE_KEY,
        createMockProvider(UNSUPPORTED_CHAIN_ID)
      );

      await expect(
        createEthersHandleClient(ethersClient, {
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
