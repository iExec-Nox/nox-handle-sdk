import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { ApiService } from '../../../../src/services/api/ApiService.js';

function mockJsonResponse(data: unknown, status = 200): Response {
  const isOk = status >= 200 && status < 300;
  return {
    ok: isOk,
    status,
    statusText: isOk ? 'OK' : 'Error',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: true, // Required for ApiService to parse JSON
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

function mockEmptyResponse(status = 204): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'No Content',
    headers: new Headers({ 'Content-Type': 'text/plain' }),
    json: () => Promise.reject(new Error('No JSON')),
    text: () => Promise.resolve(''),
  } as Response;
}

describe('ApiService', () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock;
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('constructor', () => {
    it.each([
      ['http URL', 'http://gateway.example.com'],
      ['https URL', 'https://gateway.example.com'],
      ['with trailing slash', 'https://gateway.example.com/'],
      ['with port', 'http://localhost:3000'],
      ['IP address', 'https://192.168.1.1'],
    ])('should accept %s: %s', (_, url) => {
      expect(
        () => new ApiService(url as `http${'' | 's'}://${string}`)
      ).not.toThrow();
    });

    it.each([
      ['with path segment', 'https://gateway.example.com/v1'],
      ['with query params', 'https://gateway.example.com?key=value'],
      ['with path and query', 'https://gateway.example.com/api?v=1'],
    ])('should reject URL %s: %s', (_, url) => {
      expect(
        () => new ApiService(url as `http${'' | 's'}://${string}`)
      ).toThrow(TypeError);
    });
  });

  describe('get', () => {
    const api = new ApiService('https://api.example.com');

    it('should return ok, status and data for JSON response', async () => {
      const mockData = { id: 1, name: 'test' };
      fetchSpy.mockResolvedValue(mockJsonResponse(mockData));

      const result = await api.get({ endpoint: '/v0/resources/123' });

      expect(result).toEqual({ ok: true, status: 200, data: mockData });
    });

    it('should return ok and status without data for non-JSON response', async () => {
      fetchSpy.mockResolvedValue(mockEmptyResponse(204));

      const result = await api.get({ endpoint: '/health' });

      expect(result).toEqual({ ok: true, status: 204 });
    });

    it('should return ok false for non-2xx response', async () => {
      fetchSpy.mockResolvedValue(mockJsonResponse({ error: 'Not found' }, 404));

      const result = await api.get({ endpoint: '/v0/resources/999' });

      expect(result).toEqual({
        ok: false,
        status: 404,
        data: { error: 'Not found' },
      });
    });

    it('should build URL with query parameters', async () => {
      fetchSpy.mockResolvedValue(mockJsonResponse({}));

      await api.get({
        endpoint: '/v0/resources',
        query: { page: 1, limit: 10 },
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://api.example.com/v0/resources?page=1&limit=10',
        }),
        expect.any(Object)
      );
    });

    it('should build URL without query string when query is empty', async () => {
      fetchSpy.mockResolvedValue(mockJsonResponse({}));

      await api.get({
        endpoint: '/v0/resources',
        query: {},
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://api.example.com/v0/resources',
        }),
        expect.any(Object)
      );
    });

    it('should forward custom headers', async () => {
      fetchSpy.mockResolvedValue(mockJsonResponse({}));

      await api.get({
        endpoint: '/v0/resources/123',
        headers: { Authorization: 'Bearer token123' },
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token123' },
        })
      );
    });

    it('should apply timeout if specified', async () => {
      let apiError: Error | undefined;

      await expect(
        api
          .get({
            endpoint: '/v0/resources/123',
            timeout: 1,
          })
          .catch((error) => {
            apiError = error as Error;
            throw error;
          })
      ).rejects.toThrow();
      expect(apiError).toStrictEqual(
        new Error('Network request failed for GET /v0/resources/123')
      );
      expect(((apiError as Error)?.cause as Error).message).toBe(
        'The operation was aborted due to timeout'
      );
    });
  });

  describe('post', () => {
    const api = new ApiService('https://api.example.com');

    it('should send JSON body with correct Content-Type', async () => {
      const responseData = { id: 123, created: true };
      fetchSpy.mockResolvedValue(mockJsonResponse(responseData, 201));

      const body = { name: 'test', value: 42 };
      const result = await api.post({ endpoint: '/v0/resources', body });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual({ ok: true, status: 201, data: responseData });
    });

    it('should merge custom headers with Content-Type', async () => {
      fetchSpy.mockResolvedValue(mockJsonResponse({ id: 1 }));

      await api.post({
        endpoint: '/v0/resources',
        body: { key: 'value' },
        headers: { 'X-Request-Id': 'req-123' },
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': 'req-123',
          },
        })
      );
    });

    it('should apply timeout if specified', async () => {
      let apiError: Error | undefined;

      await expect(
        api
          .post({
            endpoint: '/v0/resources/123',
            timeout: 1,
          })
          .catch((error) => {
            apiError = error as Error;
            throw error;
          })
      ).rejects.toThrow();
      expect(apiError).toStrictEqual(
        new Error('Network request failed for POST /v0/resources/123')
      );
      expect(((apiError as Error)?.cause as Error).message).toBe(
        'The operation was aborted due to timeout'
      );
    });
  });

  describe('error handling', () => {
    const api = new ApiService('https://api.example.com');

    it('should throw on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(api.post({ endpoint: '/v0/resources' })).rejects.toThrow(
        'Network request failed for POST /v0/resources'
      );
    });

    it('should throw on JSON parse error', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        body: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as Response);

      await expect(api.get({ endpoint: '/v0/resources/123' })).rejects.toThrow(
        'Failed to parse response'
      );
    });
  });
});
