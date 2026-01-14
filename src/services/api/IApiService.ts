export type QueryParameters = Record<string, string | boolean | number>;
export type Headers = Record<string, string>;
export type Body = Record<string, unknown>;
export type ResponseData<T> = { status: number; data: T | undefined };

/**
 * IApiService defines the interface for making GET and POST requests.
 */
export interface IApiService {
  get<T>(parameters: {
    endpoint: string;
    query?: QueryParameters;
    headers?: Headers;
    timeout?: number;
  }): Promise<ResponseData<T>>;

  post<T>(parameters: {
    endpoint: string;
    query?: QueryParameters;
    body?: Body;
    headers?: Headers;
    timeout?: number;
  }): Promise<ResponseData<T>>;
}
