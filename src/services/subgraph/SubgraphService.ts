import type { BaseUrl } from '../../types/internalTypes.js';
import type { Handle, SolidityType } from '../../types/publicTypes.js';

export interface ACL {
  isPublic: boolean;
  adminAccounts: string[];
  viewerAccounts: string[];
}

export interface ISubgraphService {
  subgraphUrl: BaseUrl;
  getACL(handle: Handle<SolidityType>): Promise<ACL>;
}

class SubgraphService implements ISubgraphService {
  constructor(public readonly subgraphUrl: BaseUrl) {}

  async getACL(_handle: Handle<SolidityType>): Promise<ACL> {
    throw new Error('getACL not implemented');
  }
}

export default SubgraphService;
