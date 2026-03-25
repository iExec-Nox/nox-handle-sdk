import { verifyTypedData, Wallet } from 'ethers';
import { describe, it, expect, vi } from 'vitest';
import type { EIP712TypedData } from '../../../src/services/blockchain/IBlockchainService.js';
import {
  GatewayTrustError,
  generateRequestSalt,
  verifyResponse,
} from '../../../src/utils/gatewayAttestation.js';
import {
  EIP712_TYPED_DATA_MOCK,
  mockGatewaySignature,
} from '../../helpers/mocks.js';
import {
  SUPPORTED_CHAIN_ID,
  TEST_GATEWAY_ADDRESS,
} from '../../helpers/testData.js';

describe('generateRequestSalt', () => {
  it('should generate a valid bytes32 hex string', () => {
    const salt = generateRequestSalt();
    expect(salt).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('should generate unique salts', () => {
    const salts = new Set();
    for (let index = 0; index < 100; index++) {
      salts.add(generateRequestSalt());
    }
    expect(salts.size).toBe(100);
  });
});

describe('verifyResponse', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { domain, ...TYPED_RESPONSE_MOCK } = EIP712_TYPED_DATA_MOCK;

  const TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK = {
    primaryType: TYPED_RESPONSE_MOCK.primaryType,
    types: {
      [TYPED_RESPONSE_MOCK.primaryType]:
        TYPED_RESPONSE_MOCK.types[TYPED_RESPONSE_MOCK.primaryType]?.concat([
          { name: 'extraField', type: 'string' },
        ]) ?? [],
    },
    message: { ...TYPED_RESPONSE_MOCK.message, extraField: 'extraValue' },
  };

  const mockBlockchainService = {
    getChainId: vi.fn(() => Promise.resolve(SUPPORTED_CHAIN_ID)),
    getAddress: vi.fn(() => {
      throw new Error('not implemented');
    }),
    readContract: vi
      .fn()
      .mockImplementation(() => Promise.resolve(TEST_GATEWAY_ADDRESS)),
    signTypedData: vi.fn(() => {
      throw new Error('not implemented');
    }),
    verifyTypedData: vi.fn((typedData: EIP712TypedData, signature: string) => {
      try {
        const address = verifyTypedData(
          typedData.domain,
          typedData.types,
          typedData.message,
          signature
        );
        return Promise.resolve(address);
      } catch (error) {
        return Promise.reject(error);
      }
    }),
  };

  it('should verify valid signature successfully', async () => {
    const requestSalt = generateRequestSalt();
    const signature = await mockGatewaySignature(
      TYPED_RESPONSE_MOCK,
      requestSalt
    );
    await expect(
      verifyResponse({
        blockchainService: mockBlockchainService,
        noxContractAddress: '0xNoxContract',
        ...TYPED_RESPONSE_MOCK,
        requestSalt,
        signature,
      })
    ).resolves.toBeUndefined();
    expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
    expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
    expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(1);
  });

  describe('when the gateway response is untrustable', () => {
    it('should throw an error if signature is missing', async () => {
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          ...TYPED_RESPONSE_MOCK,
          requestSalt: generateRequestSalt(),
          signature: undefined, // missing signature
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrustable Gateway response', {
          cause: new Error('Missing gateway signature'),
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(0);
    });

    it('should throw an error if data contains unexpected fields', async () => {
      const requestSalt = generateRequestSalt();
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK,
        requestSalt
      );
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          primaryType: TYPED_RESPONSE_MOCK.primaryType,
          types: TYPED_RESPONSE_MOCK.types, // expected fields
          message: TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK.message, // message with extra field
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrustable Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if data misses expected fields', async () => {
      const requestSalt = generateRequestSalt();
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_MOCK,
        requestSalt
      );
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          primaryType: TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK.primaryType,
          types: TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK.types, // expected fields
          message: TYPED_RESPONSE_MOCK.message, // message with missing field
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrustable Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if salts don't match", async () => {
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_MOCK,
        generateRequestSalt()
      );

      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          ...TYPED_RESPONSE_MOCK,
          requestSalt: generateRequestSalt(), // different salt
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrustable Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the chainId mismatch', async () => {
      const requestSalt = generateRequestSalt();
      const data = {
        primaryType: 'Test',
        types: {
          Test: [{ name: 'value', type: 'string' }],
        },
        message: {
          value: 'test',
        },
      };
      const signature = await mockGatewaySignature(data, requestSalt);
      mockBlockchainService.getChainId.mockResolvedValueOnce(
        SUPPORTED_CHAIN_ID + 1
      ); // different chainId
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          ...TYPED_RESPONSE_MOCK,
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrustable Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the signer address mismatch', async () => {
      const requestSalt = generateRequestSalt();
      const data = {
        primaryType: 'Test',
        types: {
          Test: [{ name: 'value', type: 'string' }],
        },
        message: {
          value: 'test',
        },
      };
      const signature = await mockGatewaySignature(data, requestSalt);
      const wrongAddress = Wallet.createRandom().address;
      mockBlockchainService.readContract.mockResolvedValueOnce(wrongAddress);
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          ...TYPED_RESPONSE_MOCK,
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrustable Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(1);
    });
  });

  describe('when there is an unexpected error during verification', () => {
    it('should throw an error if salt is not bytes32 hex string', async () => {
      const invalidSalt = '0x1234';
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          ...TYPED_RESPONSE_MOCK,
          requestSalt: invalidSalt,
          signature: '0xSignature',
        })
      ).rejects.toThrow(
        new Error('Gateway signature verification failed', {
          cause: new Error('Invalid salt format'),
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(0);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(0);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(0);
    });

    it('should throw an error if getChainId fails', async () => {
      const requestSalt = generateRequestSalt();
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_MOCK,
        requestSalt
      );
      const chainIdError = new Error('getChainId failed');
      mockBlockchainService.getChainId.mockRejectedValueOnce(chainIdError);
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          ...TYPED_RESPONSE_MOCK,
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new Error('Gateway signature verification failed', {
          cause: chainIdError,
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(0);
    });

    it('should throw an error if readContract fails', async () => {
      const requestSalt = generateRequestSalt();
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_MOCK,
        requestSalt
      );
      const readError = new Error('readContract failed');
      mockBlockchainService.readContract.mockRejectedValueOnce(readError);
      await expect(
        verifyResponse({
          blockchainService: mockBlockchainService,
          noxContractAddress: '0xNoxContract',
          ...TYPED_RESPONSE_MOCK,
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new Error('Gateway signature verification failed', {
          cause: readError,
        })
      );
      expect(mockBlockchainService.getChainId).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.readContract).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.verifyTypedData).toHaveBeenCalledTimes(0);
    });
  });
});
