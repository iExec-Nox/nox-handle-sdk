import { HandleClient } from '../client/HandleClient.js';
import { resolveNetworkConfig } from '../config/networks.js';
import { ApiService } from '../services/api/ApiService.js';
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
import type { HandleClientConfig } from '../client/HandleClient.js';

export type BlockchainClient = EthersClient | ViemClient;

/**
 * Creates a HandleClient from a client of either ethers or viem
 *
 * @param blockchainClient - An ethers client with a Signer and a Provider or a viem WalletClient connected to an account
 * @param config - Optional partial config to override network defaults
 * @returns A Promise of HandleClient instance
 * @throws {TypeError} if the provided blockchainClient is invalid
 * @throws {Error} if the blockchainClient fails to detect the connected chain or if the chain is not supported and no complete config is provided
 * @warning
 * This function is provided for convenience, you should use `createEthersHandleClient`
 * or `createViemHandleClient` for smaller bundle size.
 *
 * @example
 * ```ts
 * // Ethers BrowserProvider
 * import { BrowserProvider } from 'ethers';
 * import { createHandleClient } from '@iexec-nox/handle';
 *
 * const ethersClient = new BrowserProvider(window.ethereum);
 *
 * const handleClient = createHandleClient(ethersClient);
 * ```
 *
 * @example
 * ```ts
 * // Viem JSON-RPC Account
 * import { createWalletClient, custom } from 'viem'
 * import { createHandleClient } from '@iexec-nox/handle';
 *
 * const viemClient = createWalletClient({
 *   transport: custom(window.ethereum)
 * })
 *
 * const handleClient = createHandleClient(viemClient);
 * ```
 */
export const createHandleClient = async (
  blockchainClient: BlockchainClient,
  config?: Partial<HandleClientConfig>
): Promise<HandleClient> => {
  if (
    isEthersSigner(blockchainClient) ||
    isEthersBrowserProvider(blockchainClient)
  ) {
    const ethersBlockchainService = new EthersBlockchainService(
      blockchainClient
    );
    const chainId = await ethersBlockchainService.getChainId();
    const resolvedConfig = resolveNetworkConfig(chainId, config);
    const apiService = new ApiService(resolvedConfig.gatewayUrl);
    return new HandleClient({
      blockchainService: ethersBlockchainService,
      apiService,
      config: resolvedConfig,
    });
  }

  if (isViemWalletClient(blockchainClient)) {
    const viemBlockchainService = new ViemBlockchainService(blockchainClient);
    const chainId = await viemBlockchainService.getChainId();
    const resolvedConfig = resolveNetworkConfig(chainId, config);
    const apiService = new ApiService(resolvedConfig.gatewayUrl);
    return new HandleClient({
      blockchainService: viemBlockchainService,
      apiService,
      config: resolvedConfig,
    });
  }

  throw new TypeError(
    'Unsupported blockchain client. Expected either an ethers AbstractSigner with connected provider or a viem WalletClient connected to an account.'
  );
};
