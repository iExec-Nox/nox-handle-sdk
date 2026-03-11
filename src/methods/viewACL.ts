import type {
  ACL,
  ISubgraphService,
} from '../services/subgraph/SubgraphService.js';
import type { Handle, SolidityType } from '../types/publicTypes.js';
import { assertRequiredParams } from '../utils/validators.js';

export async function viewACL(
  handle: Handle<SolidityType>,
  subgraphService: ISubgraphService
): Promise<ACL> {
  assertRequiredParams({ handle }, ['handle']);
  return subgraphService.getACL(handle);
}
