import type { Account, Chain, Transport, WalletClient } from 'viem';
import { HandleClient } from '../client/HandleClient.js';
import { ViemBlockchainService } from '../services/blockchain/ViemBlockchainService.js';
import type { HandleClientConfig } from '../client/HandleClient.js';
import { resolveNetworkConfig } from '../config/networks.js';

/**
 * Creates a HandleClient from a viem WalletClient
 *
 * @param viemClient - A viem WalletClient instance connected to an account
 * @param config - Optional partial config to override network defaults
 * @returns A HandleClient instance
 * @throws {TypeError} if the provided viemClient is invalid
 * @throws {Error} if the viemClient fails to detect the connected chain or if the chain is not supported and no complete config is provided
 *
 * @example
 * ```
 * // JSON-RPC Account
 * import { createWalletClient, custom } from 'viem'
 *
 * const viemClient = createWalletClient({
 *   transport: custom(window.ethereum)
 * })
 *
 * const handleClient = createViemHandleClient(viemClient);
 * ```
 *
 * @example
 * ```
 * // Local Account
 * import { createWalletClient, http } from "viem";
 * import { privateKeyToAccount } from "viem/accounts";
 *
 * import { createViemHandleClient } from "nox-handle-sdk";
 *
 * const { RPC_URL, PRIVATE_KEY } = process.env;
 *
 * const viemClient = createWalletClient({
 *   account: privateKeyToAccount(PRIVATE_KEY),
 *   transport: http(RPC_URL),
 * });
 *
 * const handleClient = createViemHandleClient(viemClient);
 * ```
 */
export const createViemHandleClient = async (
  viemClient: WalletClient<Transport, Chain | undefined, Account>,
  config?: Partial<HandleClientConfig>
): Promise<HandleClient> => {
  const viemBlockchainService = new ViemBlockchainService(viemClient);
  const chainId = await viemBlockchainService.getChainId();
  const resolvedConfig = resolveNetworkConfig(chainId, config);
  return new HandleClient(viemBlockchainService, resolvedConfig);
};
