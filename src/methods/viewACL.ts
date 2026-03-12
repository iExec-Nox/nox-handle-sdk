import { VIEW_ACL_QUERY } from '../services/subgraph/queries/viewACL.js';
import type {
  ACL,
  ISubgraphService,
} from '../services/subgraph/SubgraphService.js';
import type { Handle, SolidityType } from '../types/publicTypes.js';
import { assertRequiredParams } from '../utils/validators.js';

interface ViewACLResponse {
  handle: {
    isPubliclyDecryptable: boolean;
    admins: Array<{ account: string }>;
    viewers: Array<{ account: string }>;
  } | null;
}

export async function viewACL(
  handle: Handle<SolidityType>,
  subgraphService: ISubgraphService
): Promise<ACL> {
  assertRequiredParams({ handle }, ['handle']);

  const response = (await subgraphService.request(VIEW_ACL_QUERY, {
    handleId: handle.toString(),
  })) as ViewACLResponse;

  if (
    !response ||
    typeof response !== 'object' ||
    !('handle' in response) ||
    response.handle === null
  ) {
    throw new Error('Handle not found');
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
