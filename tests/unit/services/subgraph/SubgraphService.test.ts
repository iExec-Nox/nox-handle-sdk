import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GraphQLClient } from 'graphql-request';
import { DUMMY_TYPED_HANDLES } from '../../../helpers/testData.js';
import SubgraphService from '../../../../src/services/subgraph/SubgraphService.js';
import { VIEW_ACL_QUERY } from '../../../../src/services/subgraph/queries/viewACL.js';

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

  it('should return ACL for a handle', async () => {
    const graphqlResponse = {
      handle: {
        isPubliclyDecryptable: false,
        roles: [
          {
            account: '0x1234567890123456789012345678901234567890',
            role: 'ADMIN',
          },
          {
            account: '0x9876543210987654321098765432109876543210',
            role: 'VIEWER',
          },
        ],
      },
    };
    mockRequest.mockResolvedValue(graphqlResponse);

    const service = new SubgraphService('https://example.com');
    const acl = await service.getACL(DUMMY_TYPED_HANDLES.bool);

    expect(acl).toEqual({
      isPublic: false,
      adminAccounts: ['0x1234567890123456789012345678901234567890'],
      viewerAccounts: ['0x9876543210987654321098765432109876543210'],
    });
    expect(mockRequest).toHaveBeenCalledWith(VIEW_ACL_QUERY, {
      handleId: DUMMY_TYPED_HANDLES.bool.toString(),
    });
  });

  it('should throw if handle not found', async () => {
    mockRequest.mockResolvedValue({ handle: null });

    const service = new SubgraphService('https://example.com');

    await expect(service.getACL(DUMMY_TYPED_HANDLES.bool)).rejects.toThrow(
      /Handle not found/
    );
  });

  it('should propagate errors', async () => {
    const error = new Error('GraphQL error');
    mockRequest.mockRejectedValue(error);

    const service = new SubgraphService('https://example.com');

    await expect(service.getACL(DUMMY_TYPED_HANDLES.bool)).rejects.toThrow(
      'GraphQL error'
    );
  });
});
