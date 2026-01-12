import type { HandleClientConfig } from '../types/types.js';

// TODO: replace with production endpoints
export const NETWORK_ENDPOINTS: Record<number, HandleClientConfig> = {
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
  const networkConfig = NETWORK_ENDPOINTS[chainId];

  if (!networkConfig && !isCompleteConfig(override)) {
    const supported = Object.keys(NETWORK_ENDPOINTS).join(', ');
    throw new Error(
      `Chain ${chainId} is not supported. Supported chains: ${supported}. ` +
        `To use an unsupported chain, provide both gatewayUrl and smartContractAddress.`
    );
  }

  return {
    gatewayUrl: override?.gatewayUrl ?? networkConfig?.gatewayUrl ?? '',
    smartContractAddress:
      override?.smartContractAddress ??
      networkConfig?.smartContractAddress ??
      '',
  };
}

function isCompleteConfig(
  config?: Partial<HandleClientConfig>
): config is HandleClientConfig {
  return !!config?.gatewayUrl && !!config?.smartContractAddress;
}
