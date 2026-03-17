import type { HandleClientConfig } from '../client/HandleClient.js';
import {
  isBaseURL,
  isEthereumAddress,
  isSubgraphURL,
} from '../utils/validators.js';

export const NETWORK_CONFIGS: Record<number, HandleClientConfig> = {
  421_614: {
    gatewayUrl: 'https://nox-handle-gateway.ovh-tdx-dev.noxprotocol.dev',
    smartContractAddress: '0xE4622fbFCd0bDd482775bBf5b3e72382C0D99208',
    subgraphUrl:
      'https://thegraph.arbitrum-sepolia-testnet.noxprotocol.io/api/subgraphs/id/BjQAX2HpmsSAzURJimKDhjZZnkSJtaczA8RPumggrStb',
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
  const subgraphUrl = override?.subgraphUrl ?? networkConfig?.subgraphUrl;

  if (!gatewayUrl || !smartContractAddress || !subgraphUrl) {
    const supported = Object.keys(NETWORK_CONFIGS).join(', ');
    throw new Error(
      `Chain ${chainId} is not supported. Supported chains: ${supported}. ` +
        `To use an unsupported chain, provide both gatewayUrl, smartContractAddress and subgraphUrl.`
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

  if (!isSubgraphURL(subgraphUrl)) {
    throw new TypeError(
      `Invalid subgraphUrl: expected valid URL, got ${subgraphUrl}`
    );
  }

  return { gatewayUrl, smartContractAddress, subgraphUrl };
}
