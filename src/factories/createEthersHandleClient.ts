import { HandleClient } from '../client/HandleClient.js';
import {
  EthersBlockchainService,
  isEthersSigner,
  type EthersSigner,
} from '../services/blockchain/EthersBlockchainService.js';

/**
 * createEthersHandleClient
 *
 * creates a HandleClient from an ethers AbstractSigner connected to a Provider
 *
 * @param signer - An ethers AbstractSigner instance connected to a Provider
 * @returns A HandleClient instance
 * @throws {TypeError} if the provided signer is invalid
 *
 * @example
 * ```
 * // BrowserProvider
 * import { BrowserProvider } from 'ethers';
 * import { createEthersHandleClient } from 'nox-handle-sdk';
 *
 * const signer = new BrowserProvider(window.ethereum);
 *
 * const handleClient = createEthersHandleClient(signer);
 * ```
 *
 * @example
 * ```
 * // Ethers Wallet
 * import { JsonRpcProvider, Wallet } from 'ethers';
 * import { createEthersHandleClient } from 'nox-handle-sdk';
 *
 * const { RPC_URL, PRIVATE_KEY } = process.env
 *
 * const provider = new JsonRpcProvider(RPC_URL);
 * const signer = new Wallet(PRIVATE_KEY, provider);
 *
 * const handleClient = createEthersHandleClient(signer);
 * ```
 */
export const createEthersHandleClient = (
  signer: EthersSigner
): HandleClient => {
  if (!isEthersSigner(signer)) {
    throw new TypeError(
      'Unsupported signer. Expected an ethers AbstractSigner instance connected to a Provider.'
    );
  }
  const ethersBlockchainService = new EthersBlockchainService(signer);
  return new HandleClient(ethersBlockchainService);
};
