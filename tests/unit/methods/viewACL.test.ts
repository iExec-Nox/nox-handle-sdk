import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { viewACL } from '../../../src/methods/viewACL.js';
import type { IBlockchainService } from '../../../src/services/blockchain/IBlockchainService.js';
import type { ISubgraphService } from '../../../src/services/subgraph/SubgraphService.js';
import { VIEW_ACL_QUERY } from '../../../src/services/subgraph/queries/viewACL.js';
import {
  SubgraphOutOfSyncError,
  UnknownHandleError,
} from '../../../src/utils/error.js';
import {
  DUMMY_TYPED_HANDLES,
  TEST_BLOCK_NUMBER,
} from '../../helpers/testData.js';

function createMockSubgraphService(
  overrides: Partial<ISubgraphService> = {}
): ISubgraphService {
  return {
    subgraphUrl: `https://example.com`,
    request: vi.fn().mockResolvedValue({
      _meta: {
        block: {
          number: TEST_BLOCK_NUMBER,
        },
      },
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
  const mockBlockchainService = {
    getBlockNumber: vi.fn().mockResolvedValue(TEST_BLOCK_NUMBER),
  } as unknown as IBlockchainService;

  it('should return ACL from subgraph service', async () => {
    const graphqlResponse = {
      _meta: {
        block: {
          number: TEST_BLOCK_NUMBER,
        },
      },
      handle: {
        isPubliclyDecryptable: false,
        admins: [{ account: '0x1234567890123456789012345678901234567890' }],
        viewers: [{ account: '0x9876543210987654321098765432109876543210' }],
      },
    };
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockResolvedValue(graphqlResponse),
    });

    const acl = await viewACL({
      handle: DUMMY_TYPED_HANDLES.bool,
      blockchainService: mockBlockchainService,
      subgraphService: mockSubgraphService,
    });

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
      viewACL({
        handle: undefined as never,
        subgraphService: mockSubgraphService,
        blockchainService: mockBlockchainService,
      })
    ).rejects.toThrow(/Missing required parameters/);
  });

  it('should throw if subgraph response is invalid', async () => {
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockResolvedValue({
        _meta: {
          block: {}, // missing block number
        },
        handle: {
          isPubliclyDecryptable: false,
          admins: [],
          viewers: [],
        },
      }),
    });

    await expect(
      viewACL({
        handle: DUMMY_TYPED_HANDLES.bool,
        subgraphService: mockSubgraphService,
        blockchainService: mockBlockchainService,
      })
    ).rejects.toThrow('Invalid response from subgraph');
  });

  it('should throw if handle not found', async () => {
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockResolvedValue({
        _meta: {
          block: {
            number: TEST_BLOCK_NUMBER,
          },
        },
        // eslint-disable-next-line unicorn/no-null
        handle: null,
      }),
    });

    await expect(
      viewACL({
        handle: DUMMY_TYPED_HANDLES.bool,
        subgraphService: mockSubgraphService,
        blockchainService: mockBlockchainService,
      })
    ).rejects.toThrow(new UnknownHandleError(DUMMY_TYPED_HANDLES.bool));
  });

  it('should handle empty admins and viewers arrays', async () => {
    const graphqlResponse = {
      _meta: {
        block: {
          number: TEST_BLOCK_NUMBER,
        },
      },
      handle: {
        isPubliclyDecryptable: true,
        admins: [],
        viewers: [],
      },
    };
    const mockSubgraphService = createMockSubgraphService({
      request: vi.fn().mockResolvedValue(graphqlResponse),
    });

    const acl = await viewACL({
      handle: DUMMY_TYPED_HANDLES.bool,
      subgraphService: mockSubgraphService,
      blockchainService: mockBlockchainService,
    });

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
      viewACL({
        handle: DUMMY_TYPED_HANDLES.bool,
        subgraphService: mockSubgraphService,
        blockchainService: mockBlockchainService,
      })
    ).rejects.toThrow('Subgraph error');
  });

  describe('when subgraph is out of sync', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    it('should retry if indexed data is outdated', async () => {
      const mockSubgraphService = createMockSubgraphService({
        request: vi
          .fn()
          .mockResolvedValueOnce({
            _meta: {
              block: {
                number: TEST_BLOCK_NUMBER - 9,
              },
            },
            // eslint-disable-next-line unicorn/no-null
            handle: null, // Simulate handle not found due to out-of-sync subgraph
          })
          .mockResolvedValueOnce({
            _meta: {
              block: {
                number: TEST_BLOCK_NUMBER,
              },
            },
            handle: {
              isPubliclyDecryptable: false,
              admins: [],
              viewers: [],
            },
          }),
      });
      const aclPromise = viewACL({
        handle: DUMMY_TYPED_HANDLES.bool,
        blockchainService: mockBlockchainService,
        subgraphService: mockSubgraphService,
      });
      await vi.runAllTimersAsync();
      const acl = await aclPromise;
      expect(acl).toEqual({
        isPublic: false,
        admins: [],
        viewers: [],
      });
      expect(mockSubgraphService.request).toHaveBeenCalledTimes(2);
    });

    it('should throw if indexed data is still not synchronized after 3 retries', async () => {
      const mockSubgraphService = createMockSubgraphService({
        request: vi.fn().mockResolvedValue({
          _meta: {
            block: {
              number: TEST_BLOCK_NUMBER - 1,
            },
          },
          handle: {
            isPubliclyDecryptable: false,
            admins: [],
            viewers: [],
          },
        }),
      });
      // capture the promise settlement without throwing
      const aclPromiseSettlementPromise = viewACL({
        handle: DUMMY_TYPED_HANDLES.bool,
        blockchainService: mockBlockchainService,
        subgraphService: mockSubgraphService,
      }).then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (error) => ({ status: 'rejected' as const, reason: error })
      );
      await vi.runAllTimersAsync();
      const aclPromiseSettlement = await aclPromiseSettlementPromise;
      expect(aclPromiseSettlement).toEqual({
        status: 'rejected',
        reason: new SubgraphOutOfSyncError({
          currentBlock: TEST_BLOCK_NUMBER,
          subgraphBlock: TEST_BLOCK_NUMBER - 1,
        }),
      });
      expect(mockSubgraphService.request).toHaveBeenCalledTimes(4); // Initial try + 3 retries
    });

    it('should throw early without retries if subgraph is out of sync by 10 blocks or more', async () => {
      const mockSubgraphService = createMockSubgraphService({
        request: vi.fn().mockResolvedValue({
          _meta: {
            block: {
              number: TEST_BLOCK_NUMBER - 10,
            },
          },
          handle: {
            isPubliclyDecryptable: false,
            admins: [],
            viewers: [],
          },
        }),
      });
      await expect(
        viewACL({
          handle: DUMMY_TYPED_HANDLES.bool,
          subgraphService: mockSubgraphService,
          blockchainService: mockBlockchainService,
        })
      ).rejects.toThrow(
        new SubgraphOutOfSyncError({
          currentBlock: TEST_BLOCK_NUMBER,
          subgraphBlock: TEST_BLOCK_NUMBER - 10,
        })
      );
      expect(mockSubgraphService.request).toHaveBeenCalledTimes(1); // No retries
    });
  });
});
