/* eslint-disable no-console */
import type { IBlockchainService } from '../../src/services/blockchain/IBlockchainService.js';

// dummy blockchain service to test types
const blockchainService: IBlockchainService = {} as IBlockchainService;

// unwrap single output
const singleOutput: bigint = await blockchainService.readContract(
  '0xContractAddress',
  {
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'test',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  } as const,
  ['0xAccountAddress', 0n]
);
console.log(singleOutput);

// support multiple outputs
const multipleOutputs: [bigint, string, bigint] =
  await blockchainService.readContract(
    '0xContractAddress',
    {
      inputs: [
        {
          name: 'account',
          type: 'address',
        },
      ],
      name: 'test',
      outputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'address',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    } as const,
    ['0xAccountAddress']
  );
console.log(multipleOutputs);

// support struct outputs
const structOutput: {
  amount: bigint;
  address: string;
} = await blockchainService.readContract(
  '0xContractAddress',
  {
    inputs: [],
    name: 'test',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'address',
            type: 'address',
          },
        ],
        internalType: 'struct TestStruct',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  } as const,
  []
);
console.log(structOutput);
