import { HandleClient } from '../client/HandleClient.js';
import {
  EthersBlockchainService,
  isEthersSigner,
  type EthersSigner,
} from '../services/blockchain/EthersBlockchainService.js';
import {
  isViemWalletClient,
  ViemBlockchainService,
  type ViemWalletClient,
} from '../services/blockchain/ViemBlockchainService.js';

export type BlockchainClient = EthersSigner | ViemWalletClient;

/**
 * createHandleClient
 *
 * creates a HandleClient from a client of either ethers or viem
 *
 * @param blockchainClient - An ethers AbstractSigner instance connected to a Provider or a viem WalletClient connected to an account
 * @returns A HandleClient instance
 * @throws {TypeError} if the provided blockchainClient is invalid
 *
 * @warning
 * This function is provided for convenience, you should use `createEthersHandleClient`
 * or `createViemHandleClient` for smaller bundle size.
 *
 * @example
 * ```
 * // Ethers BrowserProvider
 * import { BrowserProvider } from 'ethers';
 * import { createHandleClient } from 'nox-handle-sdk';
 *
 * const signer = new BrowserProvider(window.ethereum);
 *
 * const handleClient = createHandleClient(signer);
 * ```
 *
 * @example
 * ```
 * // Viem JSON-RPC Account
 * import { createWalletClient, custom } from 'viem'
 * import { createHandleClient } from 'nox-handle-sdk';
 *
 * const walletClient = createWalletClient({
 *   transport: custom(window.ethereum)
 * })
 *
 * const handleClient = createHandleClient(walletClient);
 * ```
 */
export const createHandleClient = (
  blockchainClient: BlockchainClient
): HandleClient => {
  if (isEthersSigner(blockchainClient)) {
    return new HandleClient(new EthersBlockchainService(blockchainClient));
  }

  if (isViemWalletClient(blockchainClient)) {
    return new HandleClient(new ViemBlockchainService(blockchainClient));
  }

  throw new TypeError(
    'Unsupported blockchain client. Expected either an ethers AbstractSigner with connected provider or a viem WalletClient connected to an account.'
  );
};
