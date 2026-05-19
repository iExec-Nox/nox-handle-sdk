import { verifyTypedData as ethersVerifyTypedData, Wallet } from 'ethers';
import { describe, it, expect, vi } from 'vitest';
import type { EthereumAddress, HexString } from '../../../src/index.js';
import type { EIP712TypedData } from '../../../src/services/blockchain/IBlockchainService.js';
import {
  GatewayTrustError,
  generateRequestSalt,
  attestResponse,
} from '../../../src/utils/gatewayAttestation.js';
import {
  EIP712_TYPED_DATA_MOCK,
  mockGatewaySignature,
} from '../../helpers/mocks.js';
import {
  SUPPORTED_CHAIN_ID,
  TEST_GATEWAY_ADDRESS,
} from '../../helpers/testData.js';

const spyVerifyTypedData = vi.fn(
  (typedData: EIP712TypedData, signature: HexString) => {
    try {
      const address = ethersVerifyTypedData(
        typedData.domain,
        typedData.types,
        typedData.message,
        signature
      ) as EthereumAddress;
      return Promise.resolve(address);
    } catch (error) {
      return Promise.reject(error);
    }
  }
);

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

describe('attestResponse', () => {
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

  it('should verify valid signature successfully', async () => {
    const requestSalt = generateRequestSalt();
    const signature = await mockGatewaySignature(
      TYPED_RESPONSE_MOCK,
      requestSalt
    );
    await expect(
      attestResponse({
        gatewayAddress: TEST_GATEWAY_ADDRESS,
        chainId: SUPPORTED_CHAIN_ID,
        verifyTypedData: spyVerifyTypedData,
        ...TYPED_RESPONSE_MOCK,
        requestSalt,
        signature,
      })
    ).resolves.toBeUndefined();
    expect(spyVerifyTypedData).toHaveBeenCalledTimes(1);
  });

  describe('when the gateway response is untrusted', () => {
    it('should throw an error if signature is missing', async () => {
      await expect(
        attestResponse({
          gatewayAddress: TEST_GATEWAY_ADDRESS,
          chainId: SUPPORTED_CHAIN_ID,
          verifyTypedData: spyVerifyTypedData,
          ...TYPED_RESPONSE_MOCK,
          requestSalt: generateRequestSalt(),
          signature: undefined, // missing signature
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrusted Gateway response', {
          cause: new Error('Missing gateway signature'),
        })
      );
      expect(spyVerifyTypedData).not.toHaveBeenCalled();
    });

    it('should throw an error if data contains unexpected fields', async () => {
      const requestSalt = generateRequestSalt();
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK,
        requestSalt
      );
      await expect(
        attestResponse({
          gatewayAddress: TEST_GATEWAY_ADDRESS,
          chainId: SUPPORTED_CHAIN_ID,
          verifyTypedData: spyVerifyTypedData,
          primaryType: TYPED_RESPONSE_MOCK.primaryType,
          types: TYPED_RESPONSE_MOCK.types, // expected fields
          message: TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK.message, // message with extra field
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrusted Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(spyVerifyTypedData).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if data misses expected fields', async () => {
      const requestSalt = generateRequestSalt();
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_MOCK,
        requestSalt
      );
      await expect(
        attestResponse({
          gatewayAddress: TEST_GATEWAY_ADDRESS,
          chainId: SUPPORTED_CHAIN_ID,
          verifyTypedData: spyVerifyTypedData,
          primaryType: TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK.primaryType,
          types: TYPED_RESPONSE_WITH_EXTRA_FIELD_MOCK.types, // expected fields
          message: TYPED_RESPONSE_MOCK.message, // message with missing field
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrusted Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(spyVerifyTypedData).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if salts don't match", async () => {
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_MOCK,
        generateRequestSalt()
      );

      await expect(
        attestResponse({
          gatewayAddress: TEST_GATEWAY_ADDRESS,
          chainId: SUPPORTED_CHAIN_ID,
          verifyTypedData: spyVerifyTypedData,
          ...TYPED_RESPONSE_MOCK,
          requestSalt: generateRequestSalt(), // different salt
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrusted Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(spyVerifyTypedData).toHaveBeenCalledTimes(1);
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
      await expect(
        attestResponse({
          gatewayAddress: TEST_GATEWAY_ADDRESS,
          chainId: SUPPORTED_CHAIN_ID + 1, // different chainId
          verifyTypedData: spyVerifyTypedData,
          ...TYPED_RESPONSE_MOCK,
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrusted Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(spyVerifyTypedData).toHaveBeenCalledTimes(1);
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
      const wrongAddress = Wallet.createRandom().address as EthereumAddress;
      await expect(
        attestResponse({
          gatewayAddress: wrongAddress, // wrong gateway address
          chainId: SUPPORTED_CHAIN_ID,
          verifyTypedData: spyVerifyTypedData,
          ...TYPED_RESPONSE_MOCK,
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrusted Gateway response', {
          cause: new Error('Invalid gateway signature'),
        })
      );
      expect(spyVerifyTypedData).toHaveBeenCalledTimes(1);
    });
  });

  describe('when there is an unexpected error during verification', () => {
    it('should throw an error if salt is not bytes32 hex string', async () => {
      const invalidSalt = '0x1234';
      await expect(
        attestResponse({
          gatewayAddress: TEST_GATEWAY_ADDRESS,
          chainId: SUPPORTED_CHAIN_ID,
          verifyTypedData: spyVerifyTypedData,
          ...TYPED_RESPONSE_MOCK,
          requestSalt: invalidSalt,
          signature: '0xSignature',
        })
      ).rejects.toThrow(
        new Error('Failed to attest gateway response', {
          cause: new Error('Invalid salt format'),
        })
      );
      expect(spyVerifyTypedData).not.toHaveBeenCalled();
    });

    it('should throw an error if verifyTypedData fails', async () => {
      const requestSalt = generateRequestSalt();
      const signature = await mockGatewaySignature(
        TYPED_RESPONSE_MOCK,
        requestSalt
      );
      const verifyError = new Error('verifyTypedData failed');
      const failingVerify = vi.fn().mockRejectedValueOnce(verifyError);
      await expect(
        attestResponse({
          gatewayAddress: TEST_GATEWAY_ADDRESS,
          chainId: SUPPORTED_CHAIN_ID,
          verifyTypedData: failingVerify,
          ...TYPED_RESPONSE_MOCK,
          requestSalt,
          signature,
        })
      ).rejects.toThrow(
        new GatewayTrustError('Untrusted Gateway response', {
          cause: new Error('Invalid gateway signature', { cause: verifyError }),
        })
      );
      expect(failingVerify).toHaveBeenCalledTimes(1);
    });
  });
});
