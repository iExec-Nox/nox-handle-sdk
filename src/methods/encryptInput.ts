import type { IApiService } from '../services/api/IApiService.js';
import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type {
  EncryptInputResult,
  HexString,
  InputValue,
  SolidityType,
} from '../types/internalTypes.js';
import {
  validateSolidityType,
  validateInputValue,
  validateHandle,
  validateInputProof,
} from '../utils/validators.js';

interface GatewaySecretResponse {
  handle: string;
  inputProof: string;
}

interface EncryptInputParameters {
  /** Service to interact with the blockchain (get address, chainId) */
  blockchainService: IBlockchainService;
  /** Service to call the gateway API */
  apiService: IApiService;
  /** The value to encrypt (boolean, string, or bigint depending on solidityType) */
  value: InputValue;
  /** The Solidity type of the value */
  solidityType: SolidityType;
}

/**
 * Encrypts a value and returns a handle for use in smart contracts.
 *
 * @param params - The encryption parameters
 * @returns Handle and inputProof for smart contract usage
 * @throws Error if solidityType is invalid or API call fails
 */
export async function encryptInput({
  blockchainService,
  apiService,
  value,
  solidityType,
}: EncryptInputParameters): Promise<EncryptInputResult> {
  validateSolidityType(solidityType);
  validateInputValue(value, solidityType);

  const owner = await blockchainService.getAddress();
  const chainId = await blockchainService.getChainId();

  const response = await apiService.post({
    endpoint: '/v0/secrets',
    body: { value: String(value), solidityType, owner },
  });

  if (!response.ok) {
    throw new Error(
      `Gateway API error: ${response.status} - ${JSON.stringify(response.data)}`
    );
  }

  const data = response.data as GatewaySecretResponse;

  if (!data?.handle || !data?.inputProof) {
    throw new Error('Invalid gateway response: missing handle or inputProof');
  }

  const handle = data.handle as HexString;
  const inputProof = data.inputProof as HexString;

  validateHandle({
    handle,
    expectedChainId: chainId,
    expectedSolidityType: solidityType,
  });

  validateInputProof(inputProof);

  return { handle, inputProof };
}
