import { describe, it, expect } from 'vitest';
import {
  resolveNetworkConfig,
  NETWORK_CONFIGS,
} from '../../../src/config/networks.js';

describe('resolveNetworkConfig', () => {
  const SUPPORTED_CHAIN_ID = 421_614;
  const UNSUPPORTED_CHAIN_ID = 999_999;
  const OVERRIDE_CONTRACT_ADDRESS =
    '0x1234567890123456789012345678901234567890';
  const OVERRIDE_GATEWAY_URL = 'https://custom.com';

  describe('with supported chain', () => {
    it('should return network config for supported chain', () => {
      const config = resolveNetworkConfig(SUPPORTED_CHAIN_ID);

      expect(config.gatewayUrl).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.gatewayUrl
      );
      expect(config.smartContractAddress).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.smartContractAddress
      );
    });

    it('should allow overriding gatewayUrl', () => {
      const config = resolveNetworkConfig(SUPPORTED_CHAIN_ID, {
        gatewayUrl: OVERRIDE_GATEWAY_URL,
      });

      expect(config.gatewayUrl).toBe(OVERRIDE_GATEWAY_URL);
      expect(config.smartContractAddress).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.smartContractAddress
      );
    });

    it('should allow overriding smartContractAddress', () => {
      const config = resolveNetworkConfig(SUPPORTED_CHAIN_ID, {
        smartContractAddress: OVERRIDE_CONTRACT_ADDRESS,
      });

      expect(config.gatewayUrl).toBe(
        NETWORK_CONFIGS[SUPPORTED_CHAIN_ID]?.gatewayUrl
      );
      expect(config.smartContractAddress).toBe(OVERRIDE_CONTRACT_ADDRESS);
    });
  });

  describe('with unsupported chain', () => {
    it('should throw if no config provided', () => {
      expect(() => resolveNetworkConfig(UNSUPPORTED_CHAIN_ID)).toThrow(
        'Chain 999999 is not supported. Supported chains: 421614. To use an unsupported chain, provide both gatewayUrl and smartContractAddress.'
      );
    });

    it('should throw if only gatewayUrl provided', () => {
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: OVERRIDE_GATEWAY_URL,
        })
      ).toThrow(
        'Chain 999999 is not supported. Supported chains: 421614. To use an unsupported chain, provide both gatewayUrl and smartContractAddress.'
      );
    });

    it('should throw if only smartContractAddress provided', () => {
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          smartContractAddress: OVERRIDE_CONTRACT_ADDRESS,
        })
      ).toThrow(
        'Chain 999999 is not supported. Supported chains: 421614. To use an unsupported chain, provide both gatewayUrl and smartContractAddress.'
      );
    });

    it('should work with complete config override', () => {
      const config = resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
        gatewayUrl: OVERRIDE_GATEWAY_URL,
        smartContractAddress: OVERRIDE_CONTRACT_ADDRESS,
      });

      expect(config.gatewayUrl).toBe(OVERRIDE_GATEWAY_URL);
      expect(config.smartContractAddress).toBe(OVERRIDE_CONTRACT_ADDRESS);
    });
  });

  describe('gatewayUrl validation', () => {
    it('should accept valid http URL', () => {
      const config = resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
        gatewayUrl: 'http://localhost:3000',
        smartContractAddress: OVERRIDE_CONTRACT_ADDRESS,
      });

      expect(config.gatewayUrl).toBe('http://localhost:3000');
    });

    it('should reject URL without protocol', () => {
      const invalidUrl = 'gateway.example.com';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: invalidUrl as `https://${string}`,
          smartContractAddress: OVERRIDE_CONTRACT_ADDRESS,
        })
      ).toThrow(
        `Invalid gatewayUrl: expected base URL without path or query parameters, got ${invalidUrl}`
      );
    });

    it('should reject URL with invalid protocol', () => {
      const invalidUrl = 'ftp://gateway.example.com';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: invalidUrl as `https://${string}`,
          smartContractAddress: OVERRIDE_CONTRACT_ADDRESS,
        })
      ).toThrow(
        `Invalid gatewayUrl: expected base URL without path or query parameters, got ${invalidUrl}`
      );
    });

    it('should reject empty path after protocol', () => {
      const invalidUrl = 'https://';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: invalidUrl as `https://${string}`,
          smartContractAddress: OVERRIDE_CONTRACT_ADDRESS,
        })
      ).toThrow(
        `Invalid gatewayUrl: expected base URL without path or query parameters, got ${invalidUrl}`
      );
    });
  });

  describe('smartContractAddress validation', () => {
    it('should accept valid Ethereum address', () => {
      const config = resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
        gatewayUrl: OVERRIDE_GATEWAY_URL,
        smartContractAddress: '0xAbCdEf1234567890123456789012345678901234',
      });

      expect(config.smartContractAddress).toBe(
        '0xAbCdEf1234567890123456789012345678901234'
      );
    });

    it('should reject address without 0x prefix', () => {
      const invalidAddress = '1234567890123456789012345678901234567890';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: OVERRIDE_GATEWAY_URL,
          smartContractAddress: invalidAddress as `0x${string}`,
        })
      ).toThrow(
        `Invalid smartContractAddress: expected ethereum address, got ${invalidAddress}`
      );
    });

    it('should reject address with wrong length (too short)', () => {
      const invalidAddress = '0x1234567890';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: OVERRIDE_GATEWAY_URL,
          smartContractAddress: invalidAddress,
        })
      ).toThrow(
        `Invalid smartContractAddress: expected ethereum address, got ${invalidAddress}`
      );
    });

    it('should reject address with wrong length (too long)', () => {
      const invalidAddress = '0x12345678901234567890123456789012345678901234';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: OVERRIDE_GATEWAY_URL,
          smartContractAddress: invalidAddress,
        })
      ).toThrow(
        `Invalid smartContractAddress: expected ethereum address, got ${invalidAddress}`
      );
    });

    it('should reject address with invalid hex characters', () => {
      const invalidAddress = '0xGHIJKL7890123456789012345678901234567890';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: OVERRIDE_GATEWAY_URL,
          smartContractAddress: invalidAddress,
        })
      ).toThrow(
        `Invalid smartContractAddress: expected ethereum address, got ${invalidAddress}`
      );
    });

    it('should reject address with only 0x prefix', () => {
      const invalidAddress = '0x';
      expect(() =>
        resolveNetworkConfig(UNSUPPORTED_CHAIN_ID, {
          gatewayUrl: OVERRIDE_GATEWAY_URL,
          smartContractAddress: invalidAddress,
        })
      ).toThrow(
        `Invalid smartContractAddress: expected ethereum address, got ${invalidAddress}`
      );
    });
  });
});
