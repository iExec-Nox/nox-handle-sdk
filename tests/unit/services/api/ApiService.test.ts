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
import type { ExpectedResponse } from '../../../../src/services/api/IApiService.js';
import { GatewayTrustError } from '../../../../src/utils/error.js';

const MOCK_GATEWAY_ADDRESS =
  '0x1234567890123456789012345678901234567890' as const;

function mockAttestationConfig(
  options: {
    gatewayAddress?: `0x${string}`;
    chainId?: number;
    verifyResult?: string;
  } = {}
) {
  const {
    gatewayAddress = MOCK_GATEWAY_ADDRESS,
    chainId = 1,
    verifyResult = MOCK_GATEWAY_ADDRESS,
  } = options;
  return {
    gatewayAddress,
    chainId,
    verifyTypedData: vi.fn().mockResolvedValue(verifyResult),
  };
}

const STUB_EXPECTED_RESPONSE: ExpectedResponse = {
  types: { Result: [{ name: 'id', type: 'uint256' }] },
  primaryType: 'Result',
};

function mockSignedJsonResponse(payload: unknown, status = 200): Response {
  const isOk = status >= 200 && status < 300;
  return {
    ok: isOk,
    status,
    statusText: isOk ? 'OK' : 'Error',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: true, // Required for ApiService to parse JSON
    json: () => Promise.resolve({ payload, signature: '0xdeadbeef' }),
    text: () =>
      Promise.resolve(JSON.stringify({ payload, signature: '0xdeadbeef' })),
  } as unknown as Response;
}

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
        () =>
          new ApiService(
            url as `http${'' | 's'}://${string}`,
            mockAttestationConfig()
          )
      ).not.toThrow();
    });

    it.each([
      ['with path segment', 'https://gateway.example.com/v1'],
      ['with query params', 'https://gateway.example.com?key=value'],
      ['with path and query', 'https://gateway.example.com/api?v=1'],
    ])('should reject URL %s: %s', (_, url) => {
      expect(
        () =>
          new ApiService(
            url as `http${'' | 's'}://${string}`,
            mockAttestationConfig()
          )
      ).toThrow(TypeError);
    });
  });

  describe('get', () => {
    const attestationConfig = mockAttestationConfig();
    const api = new ApiService('https://api.example.com', attestationConfig);
    it('should return ok, status and data for signed JSON response', async () => {
      const mockPayload = { id: 1, name: 'test' };
      fetchSpy.mockResolvedValue(mockSignedJsonResponse(mockPayload));

      const result = await api.get({
        endpoint: '/v0/resources/123',
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });

      expect(result).toEqual({ ok: true, status: 200, data: mockPayload });
    });

    it('should return ok false for non-2xx response without calling attestation', async () => {
      fetchSpy.mockResolvedValue(mockJsonResponse({ error: 'Not found' }, 404));

      const result = await api.get({
        endpoint: '/v0/resources/999',
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });

      expect(result).toEqual({
        ok: false,
        status: 404,
        data: { error: 'Not found' },
      });
      expect(attestationConfig.verifyTypedData).not.toHaveBeenCalled();
    });

    it('should inject salt into query parameters', async () => {
      fetchSpy.mockResolvedValue(mockSignedJsonResponse({}));

      await api.get({
        endpoint: '/v0/resources',
        query: { page: 1 },
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });

      const calledUrl: URL = fetchSpy.mock.calls[0]![0];
      expect(calledUrl.searchParams.get('page')).toBe('1');
      expect(calledUrl.searchParams.get('salt')).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should inject a unique salt for each request', async () => {
      fetchSpy.mockResolvedValue(mockSignedJsonResponse({}));

      await api.get({
        endpoint: '/v0/resources',
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });
      await api.get({
        endpoint: '/v0/resources',
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });

      const salt1 = (fetchSpy.mock.calls[0]![0] as URL).searchParams.get(
        'salt'
      );
      const salt2 = (fetchSpy.mock.calls[1]![0] as URL).searchParams.get(
        'salt'
      );
      expect(salt1).not.toBe(salt2);
    });

    it('should forward custom headers', async () => {
      fetchSpy.mockResolvedValue(mockSignedJsonResponse({}));

      await api.get({
        endpoint: '/v0/resources/123',
        headers: { Authorization: 'Bearer token123' },
        expectedResponse: STUB_EXPECTED_RESPONSE,
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
            expectedResponse: STUB_EXPECTED_RESPONSE,
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
    const attestationConfig = mockAttestationConfig();
    const api = new ApiService('https://api.example.com', attestationConfig);

    it('should send JSON body with correct Content-Type', async () => {
      const responsePayload = { id: 123, created: true };
      fetchSpy.mockResolvedValue(mockSignedJsonResponse(responsePayload, 201));

      const body = { name: 'test', value: 42 };
      const result = await api.post({
        endpoint: '/v0/resources',
        body,
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual({
        ok: true,
        status: 201,
        data: responsePayload,
      });
    });

    it('should merge custom headers with Content-Type', async () => {
      fetchSpy.mockResolvedValue(mockSignedJsonResponse({ id: 1 }));

      await api.post({
        endpoint: '/v0/resources',
        body: { key: 'value' },
        headers: { 'X-Request-Id': 'req-123' },
        expectedResponse: STUB_EXPECTED_RESPONSE,
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
            expectedResponse: STUB_EXPECTED_RESPONSE,
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
    const api = new ApiService(
      'https://api.example.com',
      mockAttestationConfig()
    );
    it('should throw on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(
        api.post({
          endpoint: '/v0/resources',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        })
      ).rejects.toThrow('Network request failed for POST /v0/resources');
    });

    it('should throw on JSON parse error', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        body: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as Response);

      await expect(
        api.get({
          endpoint: '/v0/resources/123',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        })
      ).rejects.toThrow('Failed to parse response');
    });
  });

  describe('attestation', () => {
    it('should throw GatewayTrustError if verifyTypedData returns wrong address', async () => {
      const attestationConfig = mockAttestationConfig({
        verifyResult: '0x0000000000000000000000000000000000000001', // wrong address
      });
      const api = new ApiService('https://api.example.com', attestationConfig);
      fetchSpy.mockResolvedValue(mockSignedJsonResponse({ id: 1 }));

      await expect(
        api.get({
          endpoint: '/v0/resources/123',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        })
      ).rejects.toThrow(GatewayTrustError);
    });

    it('should throw GatewayTrustError if verifyTypedData rejects', async () => {
      const attestationConfig = {
        gatewayAddress: MOCK_GATEWAY_ADDRESS,
        chainId: 1,
        verifyTypedData: vi
          .fn()
          .mockRejectedValue(new Error('signature invalid')),
      };
      const api = new ApiService('https://api.example.com', attestationConfig);
      fetchSpy.mockResolvedValue(mockSignedJsonResponse({ id: 1 }));

      await expect(
        api.get({
          endpoint: '/v0/resources/123',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        })
      ).rejects.toThrow(GatewayTrustError);
    });

    it('should throw GatewayTrustError for ok response with no signature', async () => {
      const api = new ApiService(
        'https://api.example.com',
        mockAttestationConfig()
      );
      fetchSpy.mockResolvedValue(mockJsonResponse({ id: 1 }, 200));

      await expect(
        api.get({
          endpoint: '/v0/resources/123',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        })
      ).rejects.toThrow(GatewayTrustError);
    });

    it('should not call verifyTypedData for non-ok responses', async () => {
      const attestationConfig = mockAttestationConfig();
      const api = new ApiService('https://api.example.com', attestationConfig);
      fetchSpy.mockResolvedValue(
        mockJsonResponse({ error: 'bad request' }, 400)
      );

      await api.post({
        endpoint: '/v0/resources',
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });

      expect(attestationConfig.verifyTypedData).not.toHaveBeenCalled();
    });

    it('should pass the salt used in query to verifyTypedData via domain', async () => {
      const attestationConfig = mockAttestationConfig();
      const api = new ApiService('https://api.example.com', attestationConfig);
      fetchSpy.mockResolvedValue(mockSignedJsonResponse({ id: 1 }));

      await api.get({
        endpoint: '/v0/resources/123',
        expectedResponse: STUB_EXPECTED_RESPONSE,
      });

      const calledUrl: URL = fetchSpy.mock.calls[0]![0];
      const saltInQuery = calledUrl.searchParams.get('salt');
      const typedDataPassed = attestationConfig.verifyTypedData.mock
        .calls[0]![0] as { domain: { salt: string } };
      expect(typedDataPassed.domain.salt).toBe(saltInQuery);
    });
  });

  describe('response parsing', () => {
    const api = new ApiService(
      'https://api.example.com',
      mockAttestationConfig()
    );
    describe('with legacy response format (without {payload, signature})', () => {
      it('should throw GatewayTrustError for ok legacy response (no signature)', async () => {
        fetchSpy.mockResolvedValue(mockJsonResponse({ id: 1 }, 200));
        await expect(
          api.get({
            endpoint: '/v0/resources/999',
            expectedResponse: STUB_EXPECTED_RESPONSE,
          })
        ).rejects.toThrow(GatewayTrustError);
      });

      it('should return non-ok legacy response without attestation', async () => {
        fetchSpy.mockResolvedValue(mockJsonResponse({ id: 1 }, 400));
        const result = await api.get({
          endpoint: '/v0/resources/999',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        });
        expect(result).toEqual({ ok: false, status: 400, data: { id: 1 } });
      });
    });

    describe('with {payload, signature} response format', () => {
      it('should unwrap data from payload and not expose signature', async () => {
        fetchSpy.mockResolvedValue(
          mockJsonResponse({ payload: { id: 1 }, signature: '0xdeadbeef' }, 200)
        );
        const result = await api.get({
          endpoint: '/v0/resources/999',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        });
        expect(result).toEqual({ ok: true, status: 200, data: { id: 1 } });
        expect(result).not.toHaveProperty('signature');
      });

      it('should unwrap error data for non-ok response without attestation', async () => {
        fetchSpy.mockResolvedValue(
          mockJsonResponse(
            { payload: { error: 'foo' }, signature: '0xabc123' },
            400
          )
        );
        const result = await api.get({
          endpoint: '/v0/resources/999',
          expectedResponse: STUB_EXPECTED_RESPONSE,
        });
        expect(result).toEqual({
          ok: false,
          status: 400,
          data: { error: 'foo' },
        });
      });
    });
  });
});
