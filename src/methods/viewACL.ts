import type { IBlockchainService } from '../services/blockchain/IBlockchainService.js';
import type { ISubgraphService } from '../services/subgraph/SubgraphService.js';
import {
  VIEW_ACL_QUERY,
  type ViewACLResponse,
} from '../services/subgraph/queries/viewACL.js';
import type { Handle, SolidityType } from '../types/publicTypes.js';
import { SubgraphOutOfSyncError, UnknownHandleError } from '../utils/error.js';
import { retry } from '../utils/retry.js';
import {
  assertRequiredParams,
  assertValidHandleFormat,
} from '../utils/validators.js';

/**
 * Access Control List (ACL) for a Handle, including public access, admins, and viewers.
 *
 * The ACL contains the following properties:
 * - `isPublic`: Indicates if the Handle is publicly decryptable (if `true`, anyone can decrypt it).
 * - `admins`: List of addresses that have admin permissions on the Handle.
 * - `viewers`: List of addresses that have viewer permissions on the Handle.
 */
export type ACL = {
  isPublic: boolean;
  admins: string[];
  viewers: string[];
};

export async function viewACL({
  subgraphService,
  blockchainService,
  handle,
}: {
  subgraphService: ISubgraphService;
  blockchainService: IBlockchainService;
  handle: Handle<SolidityType>;
}): Promise<ACL> {
  assertRequiredParams({ handle }, ['handle']);
  assertValidHandleFormat(handle);

  const currentBlockNumber = await blockchainService.getBlockNumber();

  const getACLFromSubgraph = async () => {
    const response = (await subgraphService.request(VIEW_ACL_QUERY, {
      handleId: handle.toString(),
    })) as ViewACLResponse;
    if (
      !response ||
      typeof response !== 'object' ||
      !('_meta' in response) ||
      !response._meta ||
      !('block' in response._meta) ||
      typeof response._meta.block !== 'object' ||
      !response._meta.block ||
      !('number' in response._meta.block) ||
      typeof response._meta.block.number !== 'number' ||
      !('handle' in response)
    ) {
      throw new Error('Invalid response from subgraph');
    }
    if (response._meta.block.number < currentBlockNumber) {
      throw new SubgraphOutOfSyncError({
        currentBlock: currentBlockNumber,
        subgraphBlock: response._meta.block.number,
      });
    }
    return response;
  };

  const response = await retry(getACLFromSubgraph, {
    // Retry options may need to be adjusted based on observed subgraph sync times
    delay: 1000,
    backoff: 2,
    maxRetries: 3,
    shouldRetry: (error) =>
      error instanceof SubgraphOutOfSyncError && error.lag < 10, // Retry if the subgraph is out of sync by less than 10 blocks
  });

  if (response.handle === null) {
    throw new UnknownHandleError(handle);
  }

  const admins = response.handle.admins?.map((admin) => admin.account) ?? [];
  const viewers =
    response.handle.viewers?.map((viewer) => viewer.account) ?? [];

  return {
    isPublic: response.handle.isPubliclyDecryptable ?? false,
    admins,
    viewers,
  };
}
