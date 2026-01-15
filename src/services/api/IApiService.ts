export type QueryParameters = Record<string, string | boolean | number>;
export type Headers = Record<string, string>;
export type Body = Record<string, unknown>;
export type ResponseData = { status: number; data?: unknown };

/**
 * IApiService defines the interface for making GET and POST requests.
 */
export interface IApiService {
  get(parameters: {
    endpoint: string;
    query?: QueryParameters;
    headers?: Headers;
    timeout?: number;
  }): Promise<ResponseData>;

  post(parameters: {
    endpoint: string;
    query?: QueryParameters;
    body?: Body;
    headers?: Headers;
    timeout?: number;
  }): Promise<ResponseData>;
}
