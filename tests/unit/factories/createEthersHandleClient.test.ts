import { it, describe, expect } from 'vitest';
import { BrowserProvider, Wallet, JsonRpcProvider } from 'ethers';
import { createEthersHandleClient } from '../../../src/factories/createEthersHandleClient.js';
import {
  BrowserProviderAdapter,
  EthersBlockchainService,
  SignerAdapter,
} from '../../../src/services/blockchain/EthersBlockchainService.js';

describe('createEthersHandleClient', () => {
  describe('with an AbstractSigner connected to a provider', () => {
    it('should create a HandleClient instance with a blockchainService of type EthersBlockchainService and a SignerAdapter', async () => {
      const ethersClient = new Wallet(
        '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1',
        new JsonRpcProvider('http://localhost:8545')
      );
      const ethersHandleClient = createEthersHandleClient(ethersClient);
      expect(ethersHandleClient).toBeDefined();
      expect(typeof ethersHandleClient).toBe('object');
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
    it('should create a HandleClient instance with a blockchainService of type EthersBlockchainService and a BrowserProviderAdapter', async () => {
      const ethersClient = new BrowserProvider({
        async request() {}, // dummy EIP-1193 provider
      });
      const ethersHandleClient = createEthersHandleClient(ethersClient);
      expect(ethersHandleClient).toBeDefined();
      expect(typeof ethersHandleClient).toBe('object');
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
      const ethersClient = new Wallet(
        '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1'
      );
      expect(() => createEthersHandleClient(ethersClient)).toThrowError(
        new TypeError(
          'Unsupported client. Expected an ethers AbstractSigner instance connected to a Provider or a BrowserProvider.'
        )
      );
    });
  });

  describe('with an invalid client', () => {
    it('should throw an error', () => {
      const invalidClient = {} as never;
      expect(() => createEthersHandleClient(invalidClient)).toThrowError(
        new TypeError(
          'Unsupported client. Expected an ethers AbstractSigner instance connected to a Provider or a BrowserProvider.'
        )
      );
    });
  });
});
