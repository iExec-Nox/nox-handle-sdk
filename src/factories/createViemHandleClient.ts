import type { Account, Chain, Transport, WalletClient } from 'viem';
import { HandleClient } from '../client/HandleClient.js';
import {
  isViemWalletClient,
  ViemBlockchainService,
} from '../services/blockchain/ViemBlockchainService.js';

/**
 * createViemHandleClient
 *
 * creates a HandleClient from a viem WalletClient
 *
 * @param walletClient - A viem WalletClient instance connected to an account
 * @returns A HandleClient instance
 * @throws {TypeError} if the provided walletClient is invalid
 *
 * @example
 * ```
 * // JSON-RPC Account
 * import { createWalletClient, custom } from 'viem'
 *
 * const walletClient = createWalletClient({
 *   transport: custom(window.ethereum)
 * })
 *
 * const handleClient = createViemHandleClient(walletClient);
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
 * const walletClient = createWalletClient({
 *   account: privateKeyToAccount(PRIVATE_KEY),
 *   transport: http(RPC_URL),
 * });
 *
 * const handleClient = createViemHandleClient(walletClient);
 * ```
 */
export const createViemHandleClient = (
  walletClient: WalletClient<Transport, Chain | undefined, Account>
): HandleClient => {
  if (!isViemWalletClient(walletClient)) {
    throw new TypeError(
      'Unsupported walletClient. Expected a viem WalletClient instance connected to an account.'
    );
  }
  const viemBlockchainService = new ViemBlockchainService(walletClient);
  return new HandleClient(viemBlockchainService);
};
