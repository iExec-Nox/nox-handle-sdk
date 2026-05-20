import type { EIP712TypedData } from '../../services/blockchain/IBlockchainService.js';
import type {
  EthereumAddress,
  BaseUrl,
  HexString,
} from '../../types/internalTypes.js';
import {
  generateRequestSalt,
  attestResponse,
} from '../../utils/gatewayAttestation.js';
import { isBaseURL } from '../../utils/validators.js';
import type {
  IApiService,
  QueryParameters,
  Headers,
  Body,
  ResponseData,
  ExpectedResponse,
} from './IApiService.js';

type InternalResponseData = ResponseData & { signature?: string };

/**
 * ApiService implements the IApiService interface abstracting communication with an API.
 */
export class ApiService implements IApiService {
  private readonly baseUrl: BaseUrl;
  private readonly attestationConfig: {
    gatewayAddress: EthereumAddress;
    chainId: number;
    verifyTypedData: (
      data: EIP712TypedData,
      signature: HexString
    ) => Promise<EthereumAddress>;
  };

  constructor(
    baseUrl: BaseUrl,
    attestationConfig: {
      gatewayAddress: EthereumAddress;
      chainId: number;
      verifyTypedData: (
        data: EIP712TypedData,
        signature: HexString
      ) => Promise<EthereumAddress>;
    }
  ) {
    if (!isBaseURL(baseUrl)) {
      throw new TypeError(
        'Invalid API base URL. It must be a base URL starting with "http://" or "https://" without path segment or query parameters.'
      );
    }
    this.baseUrl = baseUrl;
    this.attestationConfig = attestationConfig;
  }

  async get({
    endpoint,
    query,
    headers,
    timeout,
    expectedResponse,
  }: {
    endpoint: string;
    query?: QueryParameters;
    headers?: Headers;
    timeout?: number;
    expectedResponse: ExpectedResponse;
  }): Promise<ResponseData> {
    const salt = generateRequestSalt();
    const result = await makeCall({
      method: 'GET',
      baseUrl: this.baseUrl,
      endpoint,
      query: { ...query, salt },
      headers,
      timeout,
    });
    if (result.ok) {
      await attestResponse({
        gatewayAddress: this.attestationConfig.gatewayAddress,
        chainId: this.attestationConfig.chainId,
        verifyTypedData: this.attestationConfig.verifyTypedData,
        message: result.data as EIP712TypedData['message'],
        types: expectedResponse.types,
        primaryType: expectedResponse.primaryType,
        requestSalt: salt,
        signature: result.signature,
      });
    } else {
      // TODO: verify non-ok response provenance when supported
    }
    return {
      ok: result.ok,
      status: result.status,
      data: result.data,
    };
  }

  async post({
    endpoint,
    query,
    body,
    headers,
    timeout,
    expectedResponse,
  }: {
    endpoint: string;
    query?: QueryParameters;
    body?: Body;
    headers?: Headers;
    timeout?: number;
    expectedResponse: ExpectedResponse;
  }): Promise<ResponseData> {
    const salt = generateRequestSalt();
    const result = await makeCall({
      method: 'POST',
      baseUrl: this.baseUrl,
      endpoint,
      query: { ...query, salt },
      body,
      headers,
      timeout,
    });
    if (result.ok) {
      await attestResponse({
        gatewayAddress: this.attestationConfig.gatewayAddress,
        chainId: this.attestationConfig.chainId,
        verifyTypedData: this.attestationConfig.verifyTypedData,
        message: result.data as EIP712TypedData['message'],
        types: expectedResponse.types,
        primaryType: expectedResponse.primaryType,
        requestSalt: salt,
        signature: result.signature,
      });
    } else {
      // TODO: verify non-ok response provenance when supported
    }
    return {
      ok: result.ok,
      status: result.status,
      data: result.data,
    };
  }
}

/**
 * Builds a query string from the given parameters.
 */
function buildQueryString(query?: QueryParameters): string {
  if (!query) {
    return '';
  }
  const queryParameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    queryParameters.append(key, String(value));
  }
  const queryString = queryParameters.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Builds RequestInit object for fetch API calls.
 */
function buildRequestInit({
  method,
  headers,
  body,
  timeout,
}: {
  method: 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Headers;
  body?: Body;
  timeout?: number;
}): RequestInit {
  const hasBody = body && method !== 'GET' && method !== 'HEAD';
  const init: RequestInit = {
    method,
    headers: hasBody
      ? { 'Content-Type': 'application/json', ...headers }
      : headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  };
  if (timeout) {
    init.signal = AbortSignal.timeout(timeout);
  }
  return init;
}

/**
 * Makes an API call using fetch and handles errors and response parsing.
 */
async function makeCall({
  method,
  baseUrl,
  endpoint,
  query,
  body,
  headers,
  timeout,
}: {
  method: 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE';
  baseUrl: BaseUrl;
  endpoint: string;
  query?: QueryParameters;
  body?: Body;
  headers?: Headers;
  timeout?: number;
}): Promise<InternalResponseData> {
  const cleanEndpoint = endpoint.replace(/^\/+/, ''); // remove leading slashes
  const url = new URL(`${cleanEndpoint}${buildQueryString(query)}`, baseUrl);
  const requestInit = buildRequestInit({
    method,
    headers,
    body,
    timeout,
  });

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    throw new Error(`Network request failed for ${method} /${cleanEndpoint}`, {
      cause: error,
    });
  }

  try {
    const result: InternalResponseData = {
      ok: response.ok,
      status: response.status,
    };
    // parse response body based on Content-Type
    if (
      response.headers.get('Content-Type')?.includes('application/json') &&
      response.body
    ) {
      const data = await response.json();
      if (
        typeof data?.payload === 'object' &&
        typeof data?.signature === 'string'
      ) {
        result.data = data.payload;
        result.signature = data.signature;
      } else {
        // legacy response format without "payload" wrapper
        result.data = data;
      }
    }
    return result;
  } catch (error) {
    throw new Error(
      `Failed to parse response from (${response.status}) ${method} /${cleanEndpoint}`,
      {
        cause: error,
      }
    );
  }
}
