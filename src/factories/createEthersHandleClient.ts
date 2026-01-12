import { HandleClient } from '../client/HandleClient.js';
import {
  EthersBlockchainService,
  type EthersClient,
} from '../services/blockchain/EthersBlockchainService.js';

/**
 * Creates a HandleClient from an ethers signer provider
 *
 * @param ethersClient - An ethers AbstractSigner instance connected to a Provider or a BrowserProvider instance
 * @returns A HandleClient instance
 * @throws {TypeError} if the provided signer is invalid
 *
 * @example
 * ```
 * // BrowserProvider
 * import { BrowserProvider } from 'ethers';
 * import { createEthersHandleClient } from 'nox-handle-sdk';
 *
 * const ethersClient = new BrowserProvider(window.ethereum);
 *
 * const handleClient = createEthersHandleClient(ethersClient);
 * ```
 *
 * @example
 * ```
 * // Ethers Wallet
 * import { JsonRpcProvider, Wallet } from 'ethers';
 * import { createEthersHandleClient } from 'nox-handle-sdk';
 *
 * const { RPC_URL, PRIVATE_KEY } = process.env;
 *
 * const provider = new JsonRpcProvider(RPC_URL);
 * const ethersClient = new Wallet(PRIVATE_KEY, provider);
 *
 * const handleClient = createEthersHandleClient(ethersClient);
 * ```
 */
export const createEthersHandleClient = (
  ethersClient: EthersClient
): HandleClient => {
  const ethersBlockchainService = new EthersBlockchainService(ethersClient);
  return new HandleClient(ethersBlockchainService);
};
