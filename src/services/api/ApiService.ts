import type {
  IApiService,
  QueryParameters,
  Headers,
  Body,
  ResponseData,
} from './IApiService.js';

/**
 * ApiService implements the IApiService interface abstracting communication with an API.
 */
export class ApiService implements IApiService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async get<T>({
    endpoint,
    query,
    headers,
    timeout,
  }: {
    endpoint: string;
    query?: QueryParameters;
    headers?: Headers;
    timeout?: number;
  }): Promise<ResponseData<T>> {
    return makeCall<T>({
      method: 'GET',
      apiUrl: this.apiUrl,
      endpoint,
      query,
      headers,
      timeout,
    });
  }

  async post<T>({
    endpoint,
    query,
    body,
    headers,
    timeout,
  }: {
    endpoint: string;
    query?: QueryParameters;
    body?: Body;
    headers?: Headers;
    timeout?: number;
  }): Promise<ResponseData<T>> {
    return makeCall<T>({
      method: 'POST',
      apiUrl: this.apiUrl,
      endpoint,
      query,
      body,
      headers,
      timeout,
    });
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
async function makeCall<T>({
  method,
  apiUrl,
  endpoint,
  query,
  body,
  headers,
  timeout,
}: {
  method: 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiUrl: string;
  endpoint: string;
  query?: QueryParameters;
  body?: Body;
  headers?: Headers;
  timeout?: number;
}): Promise<ResponseData<T>> {
  const url = new URL(`${endpoint}${buildQueryString(query)}`, apiUrl);
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
    throw new Error(`Network request failed for ${method} ${endpoint}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    // for now assuming that non OK responses are errors (this may be adjusted as needed)
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} for ${method} ${endpoint}`
    );
  }

  try {
    // parsing response based on Content-Type
    let data = undefined;
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      data = (await response.json()) as T;
    }
    return { status: response.status, data };
  } catch (error) {
    throw new Error(`Failed to parse response from ${method} ${endpoint}`, {
      cause: error,
    });
  }
}
