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
} from '../utils/validators.js';

/**
 * Raw response from the gateway /v0/secrets endpoint
 */
type GatewaySecretResponse = {
  handle: string;
  inputProof: string;
};

/**
 * Encrypts a value and returns a handle for use in smart contracts.
 *
 * @param blockchainService - Service to interact with the blockchain (get address, chainId)
 * @param apiService - Service to call the gateway API
 * @param value - The value to encrypt (boolean, string, or bigint depending on solidityType)
 * @param solidityType - The Solidity type of the value
 * @returns Handle and inputProof for smart contract usage
 * @throws Error if solidityType is invalid or API call fails
 */
export async function encryptInput(
  blockchainService: IBlockchainService,
  apiService: IApiService,
  value: InputValue,
  solidityType: SolidityType
): Promise<EncryptInputResult> {
  validateSolidityType(solidityType);
  validateInputValue(value, solidityType);

  const owner = await blockchainService.getAddress();

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

  return { handle, inputProof };
}
