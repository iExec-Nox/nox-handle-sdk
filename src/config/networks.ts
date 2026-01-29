import type { HandleClientConfig } from '../client/HandleClient.js';
import { isBaseURL, isEthereumAddress } from '../utils/validators.js';

// TODO: replace with production endpoints
export const NETWORK_CONFIGS: Record<number, HandleClientConfig> = {
  421_614: {
    gatewayUrl: 'https://nox-gateway.arbitrum-sepolia-testnet.iex.ec',
    smartContractAddress: '0x4e5eFffc593B22A50e37C772DaC0F3aFD905B1a2',
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
      `Invalid gatewayUrl: expected base URL without path or query parameters, got ${gatewayUrl}`
    );
  }

  if (!isEthereumAddress(smartContractAddress)) {
    throw new TypeError(
      `Invalid smartContractAddress: expected ethereum address, got ${smartContractAddress}`
    );
  }

  return { gatewayUrl, smartContractAddress };
}
