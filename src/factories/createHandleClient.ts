import { HandleClient } from '../client/HandleClient.js';
import {
  EthersBlockchainService,
  isEthersSigner,
  isEthersBrowserProvider,
  type EthersClient,
} from '../services/blockchain/EthersBlockchainService.js';
import {
  isViemWalletClient,
  ViemBlockchainService,
  type ViemClient,
} from '../services/blockchain/ViemBlockchainService.js';

export type BlockchainClient = EthersClient | ViemClient;

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
 * const ethersClient = new BrowserProvider(window.ethereum);
 *
 * const handleClient = createHandleClient(ethersClient);
 * ```
 *
 * @example
 * ```
 * // Viem JSON-RPC Account
 * import { createWalletClient, custom } from 'viem'
 * import { createHandleClient } from 'nox-handle-sdk';
 *
 * const viemClient = createWalletClient({
 *   transport: custom(window.ethereum)
 * })
 *
 * const handleClient = createHandleClient(viemClient);
 * ```
 */
export const createHandleClient = (
  blockchainClient: BlockchainClient
): HandleClient => {
  if (
    isEthersSigner(blockchainClient) ||
    isEthersBrowserProvider(blockchainClient)
  ) {
    return new HandleClient(new EthersBlockchainService(blockchainClient));
  }

  if (isViemWalletClient(blockchainClient)) {
    return new HandleClient(new ViemBlockchainService(blockchainClient));
  }

  throw new TypeError(
    'Unsupported blockchain client. Expected either an ethers AbstractSigner with connected provider or a viem WalletClient connected to an account.'
  );
};
