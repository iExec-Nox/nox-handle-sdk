import { describe, expect, it, vi } from 'vitest';
import { viewACL } from '../../../src/methods/viewACL.js';
import { DUMMY_TYPED_HANDLES } from '../../helpers/testData.js';
import type { ISubgraphService } from '../../../src/services/subgraph/SubgraphService.js';
import { VIEW_ACL_QUERY } from '../../../src/services/subgraph/queries/viewACL.js';

function createMockSubgraphService(
  overrides: Partial<ISubgraphService> = {}
): ISubgraphService {
  return {
    subgraphUrl: `https://example.com`,
    request: vi.fn().mockResolvedValue({
      handle: {
        isPubliclyDecryptable: false,
        admins: [],
        viewers: [],
      },
    }),
    ...overrides,
  };
}

describe('viewACL', () => {
  it('should return ACL from subgraph service', async () => {
    const graphqlResponse = {
      handle: {
        isPubliclyDecryptable: false,
        admins: [{ account: '0x1234567890123456789012345678901234567890' }],
        viewers: [{ account: '0x9876543210987654321098765432109876543210' }],
      },
    };
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockResolvedValue(graphqlResponse),
    });

    const acl = await viewACL(DUMMY_TYPED_HANDLES.bool, mockSubgraphService);

    expect(acl).toEqual({
      isPublic: false,
      admins: ['0x1234567890123456789012345678901234567890'],
      viewers: ['0x9876543210987654321098765432109876543210'],
    });
    expect(mockSubgraphService.request).toHaveBeenCalledWith(VIEW_ACL_QUERY, {
      handleId: DUMMY_TYPED_HANDLES.bool.toString(),
    });
  });

  it('should throw if handle is missing', async () => {
    const mockSubgraphService = createMockSubgraphService();

    await expect(
      viewACL(undefined as never, mockSubgraphService)
    ).rejects.toThrow(/Missing required parameters/);
  });

  it('should throw if handle not found', async () => {
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockResolvedValue({ handle: null }),
    });

    await expect(
      viewACL(DUMMY_TYPED_HANDLES.bool, mockSubgraphService)
    ).rejects.toThrow(/Handle not found/);
  });

  it('should handle empty admins and viewers arrays', async () => {
    const graphqlResponse = {
      handle: {
        isPubliclyDecryptable: true,
        admins: [],
        viewers: [],
      },
    };
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockResolvedValue(graphqlResponse),
    });

    const acl = await viewACL(DUMMY_TYPED_HANDLES.bool, mockSubgraphService);

    expect(acl).toEqual({
      isPublic: true,
      admins: [],
      viewers: [],
    });
  });

  it('should propagate errors from subgraph service', async () => {
    const error = new Error('Subgraph error');
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockRejectedValue(error),
    });

    await expect(
      viewACL(DUMMY_TYPED_HANDLES.bool, mockSubgraphService)
    ).rejects.toThrow('Subgraph error');
  });
});
