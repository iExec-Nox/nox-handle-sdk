import { GraphQLClient } from 'graphql-request';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import SubgraphService from '../../../../src/services/subgraph/SubgraphService.js';

vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
  })),
}));

describe('SubgraphService', () => {
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    vi.mocked(GraphQLClient).mockImplementation(
      () =>
        ({
          request: mockRequest,
        }) as never
    );
  });

  it('should create a GraphQLClient with the provided URL', () => {
    const url = 'https://subgraph.example.com';
    const service = new SubgraphService(url);
    expect(service.subgraphUrl).toBe(url);
    expect(GraphQLClient).toHaveBeenCalledWith(url, { headers: {} });
  });

  it('should call GraphQL client request with query and variables', async () => {
    const query = 'query { test }';
    const variables = { id: '123' };
    const graphqlResponse = { data: 'test' };
    mockRequest.mockResolvedValue(graphqlResponse);

    const service = new SubgraphService('https://example.com');
    const result = await service.request(query, variables);

    expect(result).toEqual(graphqlResponse);
    expect(mockRequest).toHaveBeenCalledWith(query, variables);
  });

  it('should wrap errors with descriptive message', async () => {
    const error = new Error('GraphQL error');
    mockRequest.mockRejectedValue(error);

    const service = new SubgraphService('https://example.com');

    await expect(service.request('query', {})).rejects.toThrow(
      'Failed to request from subgraph'
    );
    await expect(service.request('query', {})).rejects.toHaveProperty(
      'cause',
      error
    );
  });
});
