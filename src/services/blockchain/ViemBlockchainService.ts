import type { WalletClient } from 'viem';
import type {
  EIP712TypedData,
  IBlockchainService,
} from './IBlockchainService.js';
import type { EthereumAddress, HexString } from '../../types/internalTypes.js';
import type {
  AbiFragmentTypes,
  AbiReadFunctionJsonFragment,
} from './abi.types.js';
import { safeJsonStringify } from '../../utils/format.js';
import type { SmartAccount } from 'viem/account-abstraction';

export type ViemClient = WalletClient;
export type ViemSmartAccount = SmartAccount;
/**
 * Type guard to check if a client is a viem WalletClient connected to an account
 *
 * @dev ⚠️ Update this function to match ViemBlockchainService requirements changes
 */
export function isViemWalletClient(object: unknown): object is ViemClient {
  return (
    !!object &&
    typeof object === 'object' &&
    'getChainId' in object &&
    typeof object.getChainId === 'function' &&
    'getAddresses' in object &&
    typeof object.getAddresses === 'function'
  );
}

/**
 * Type guard to check if a client is a viem SmartAccount (ERC-4337)
 */
export function isSmartAccount(object: unknown): object is SmartAccount {
  return (
    !!object &&
    typeof object === 'object' &&
    'type' in object &&
    object.type === 'smart' &&
    'getAddress' in object &&
    typeof object.getAddress === 'function' &&
    'signTypedData' in object &&
    typeof object.signTypedData === 'function' &&
    'client' in object &&
    !!object.client
  );
}
/**
 * Implements IBlockchainService using viem library.
 */
export class ViemBlockchainService implements IBlockchainService {
  // eslint-disable-next-line unicorn/no-null
  private static viemModule: typeof import('viem') | null = null;

  private static async getViemModule(): Promise<typeof import('viem')> {
    this.viemModule ??= await import('viem');
    return this.viemModule;
  }

  private readonly viemClient: WalletClient;
  private readonly smartAccount: SmartAccount | undefined = undefined;
  /**
   * Creates an instance of ViemBlockchainService.
   * @param client - A viem WalletClient instance connected to an account
   * @returns A ViemBlockchainService instance
   * @throws {TypeError} if the provided client is invalid
   */
  constructor(client: ViemClient | SmartAccount) {
    if (isSmartAccount(client)) {
      this.smartAccount = client;
      this.viemClient = client.client as WalletClient;
    } else if (isViemWalletClient(client)) {
      this.viemClient = client;
      this.smartAccount = undefined;
    } else {
      throw new TypeError(
        'Unsupported client. Expected a viem WalletClient instance connected to an account.'
      );
    }
  }

  async getChainId(): Promise<number> {
    try {
      if (this.smartAccount?.client?.chain?.id) {
        return this.smartAccount.client.chain.id;
      }
      const chainId = await this.viemClient.getChainId();
      return chainId;
    } catch (error) {
      throw new Error('Failed to get chain ID', { cause: error });
    }
  }

  async getAddress(): Promise<EthereumAddress> {
    try {
      if (this.smartAccount) {
        return await this.smartAccount.getAddress();
      }
      const addresses = await this.viemClient.getAddresses();
      const address = addresses[0];
      if (!address) {
        throw new Error('No connected account');
      }
      return address;
    } catch (error) {
      throw new Error('Failed to get address', { cause: error });
    }
  }

  async readContract<T extends AbiReadFunctionJsonFragment>(
    contractAddress: EthereumAddress,
    abiFunctionFragment: T,
    parameters: AbiFragmentTypes<T, 'inputs'>
  ): Promise<AbiFragmentTypes<T, 'outputs'>> {
    try {
      const { publicActions } = await ViemBlockchainService.getViemModule();

      // Use the underlying client for SmartAccount
      const clientToExtend = this.smartAccount?.client ?? this.viemClient;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const publicClient = (clientToExtend as any).extend(publicActions);

      return (await publicClient.readContract({
        address: contractAddress,
        abi: [abiFunctionFragment],
        functionName: abiFunctionFragment.name,
        args: parameters,
      })) as AbiFragmentTypes<T, 'outputs'>;
    } catch (error) {
      throw new Error(
        `Failed to read contract at ${contractAddress} (method: ${abiFunctionFragment.name}, parameters: ${safeJsonStringify(parameters)})`,
        {
          cause: error,
        }
      );
    }
  }

  async signTypedData(data: EIP712TypedData): Promise<HexString> {
    try {
      // SmartAccount has its own signTypedData
      if (this.smartAccount) {
        const signature = await this.smartAccount.signTypedData({
          domain: data.domain,
          types: data.types,
          primaryType: data.primaryType,
          message: data.message,
        });
        return signature as HexString;
      }

      // WalletClient needs account address
      const address = await this.getAddress();
      const signature = await this.viemClient.signTypedData({
        account: address,
        domain: data.domain,
        types: data.types,
        primaryType: data.primaryType,
        message: data.message,
      });
      return signature;
    } catch (error) {
      throw new Error('Failed to sign typed data', { cause: error });
    }
  }
}
