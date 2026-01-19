import type { HandleClientConfig } from '../client/HandleClient.js';
import { isBaseURL, isEthereumAddress } from '../utils/validators.js';

// TODO: replace with production endpoints
export const NETWORK_CONFIGS: Record<number, HandleClientConfig> = {
  421_614: {
    gatewayUrl: 'https://gateway.testnet.nox.com',
    smartContractAddress: '0x0000000000000000000000000000000000000000',
  },
  42_161: {
    gatewayUrl: 'https://gateway.mainnet.nox.com',
    smartContractAddress: '0x0000000000000000000000000000000000000000',
  },
};

export function resolveNetworkConfig(
  chainId: number,
  override?: Partial<HandleClientConfig>
): HandleClientConfig {
  const networkConfig = NETWORK_CONFIGS[chainId];

  const gatewayUrl = override?.gatewayUrl ?? networkConfig?.gatewayUrl;
  const smartContractAddress =
    override?.smartContractAddress ?? networkConfig?.smartContractAddress;

  if (!gatewayUrl || !smartContractAddress) {
    const supported = Object.keys(NETWORK_CONFIGS).join(', ');
    throw new Error(
      `Chain ${chainId} is not supported. Supported chains: ${supported}. ` +
        `To use an unsupported chain, provide both gatewayUrl and smartContractAddress.`
    );
  }

  if (!isBaseURL(gatewayUrl)) {
    throw new TypeError(
      `Invalid gatewayUrl: "${gatewayUrl}". Must start with http:// or https://`
    );
  }

  if (!isEthereumAddress(smartContractAddress)) {
    throw new TypeError(
      `Invalid smartContractAddress: "${smartContractAddress}". Must be a valid Ethereum address (0x + 40 hex chars)`
    );
  }

  return { gatewayUrl, smartContractAddress };
}
