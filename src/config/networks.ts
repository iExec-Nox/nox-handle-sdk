import type { HandleClientConfig } from '../client/HandleClient.js';
import type { BaseUrl, EthereumAddress } from '../types/internalTypes.js';

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

function isValidBaseUrl(url: string): url is BaseUrl {
  return /^https?:\/\/.+/.test(url);
}

function isValidEthereumAddress(address: string): address is EthereumAddress {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

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

  if (!isValidBaseUrl(gatewayUrl)) {
    throw new Error(
      `Invalid gatewayUrl: "${gatewayUrl}". Must start with http:// or https://`
    );
  }

  if (!isValidEthereumAddress(smartContractAddress)) {
    throw new Error(
      `Invalid smartContractAddress: "${smartContractAddress}". Must be a valid Ethereum address (0x + 40 hex chars)`
    );
  }

  return { gatewayUrl, smartContractAddress };
}
