import type { Account, Chain, Transport, WalletClient } from 'viem';
import { HandleClient } from '../client/HandleClient.js';
import { ViemBlockchainService } from '../services/blockchain/ViemBlockchainService.js';

/**
 * createViemHandleClient
 *
 * creates a HandleClient from a viem WalletClient
 *
 * @param viemClient - A viem WalletClient instance connected to an account
 * @returns A HandleClient instance
 * @throws {TypeError} if the provided viemClient is invalid
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
export const createViemHandleClient = (
  viemClient: WalletClient<Transport, Chain | undefined, Account>
): HandleClient => {
  const viemBlockchainService = new ViemBlockchainService(viemClient);
  return new HandleClient(viemBlockchainService);
};
