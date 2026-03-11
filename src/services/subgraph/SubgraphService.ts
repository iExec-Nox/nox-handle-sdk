import { GraphQLClient } from 'graphql-request';
import type { BaseUrl } from '../../types/internalTypes.js';
import type { Handle, SolidityType } from '../../types/publicTypes.js';
import { VIEW_ACL_QUERY } from './queries/viewACL.js';

export interface ACL {
  isPublic: boolean;
  adminAccounts: string[];
  viewerAccounts: string[];
}

export interface ISubgraphService {
  subgraphUrl: BaseUrl;
  getACL(handle: Handle<SolidityType>): Promise<ACL>;
}

interface GraphQLResponse {
  handle: {
    isPubliclyDecryptable: boolean;
    roles: Array<{
      account: string;
      role: string;
    }>;
  } | null;
}

class SubgraphService implements ISubgraphService {
  private readonly client: GraphQLClient;

  constructor(public readonly subgraphUrl: BaseUrl) {
    this.client = new GraphQLClient(subgraphUrl, { headers: {} });
  }

  async getACL(handle: Handle<SolidityType>): Promise<ACL> {
    const response = (await this.client.request(VIEW_ACL_QUERY, {
      handleId: handle.toString(),
    })) as GraphQLResponse;

    if (!response.handle) {
      throw new Error('Handle not found');
    }

    const adminAccounts: string[] = [];
    const viewerAccounts: string[] = [];

    for (const role of response.handle.roles) {
      if (role.role === 'ADMIN') {
        adminAccounts.push(role.account);
      } else if (role.role === 'VIEWER') {
        viewerAccounts.push(role.account);
      }
    }

    return {
      isPublic: response.handle.isPubliclyDecryptable,
      adminAccounts,
      viewerAccounts,
    };
  }
}

export default SubgraphService;
