import { describe, expect, it, vi } from 'vitest';
import { viewACL } from '../../../src/methods/viewACL.js';
import { DUMMY_TYPED_HANDLES } from '../../helpers/testData.js';
import type { ISubgraphService } from '../../../src/services/subgraph/SubgraphService.js';

function createMockSubgraphService(
  overrides: Partial<ISubgraphService> = {}
): ISubgraphService {
  return {
    subgraphUrl: `https://example.com`,
    getACL: vi.fn().mockResolvedValue({
      isPublic: false,
      adminAccounts: [],
      viewerAccounts: [],
    }),
    ...overrides,
  };
}

describe('viewACL', () => {
  it('should return ACL from subgraph service', async () => {
    const expectedACL = {
      isPublic: false,
      adminAccounts: ['0x1234567890123456789012345678901234567890'],
      viewerAccounts: ['0x9876543210987654321098765432109876543210'],
    };
    const mockSubgraphService = createMockSubgraphService({
      getACL: vi.fn().mockResolvedValue(expectedACL),
    });

    const acl = await viewACL(DUMMY_TYPED_HANDLES.bool, mockSubgraphService);

    expect(acl).toEqual(expectedACL);
    expect(mockSubgraphService.getACL).toHaveBeenCalledWith(
      DUMMY_TYPED_HANDLES.bool
    );
  });

  it('should throw if handle is missing', async () => {
    const mockSubgraphService = createMockSubgraphService();

    await expect(
      viewACL(undefined as never, mockSubgraphService)
    ).rejects.toThrow(/Missing required parameters/);
  });

  it('should propagate errors from subgraph service', async () => {
    const error = new Error('Subgraph error');
    const mockSubgraphService = createMockSubgraphService({
      getACL: vi.fn().mockRejectedValue(error),
    });

    await expect(
      viewACL(DUMMY_TYPED_HANDLES.bool, mockSubgraphService)
    ).rejects.toThrow('Subgraph error');
  });
});
