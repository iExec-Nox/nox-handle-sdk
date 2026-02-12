import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createMockEIP1193Provider } from '../../../helpers/mocks.js';
import {
  ViemBlockchainService,
  isSmartAccount,
} from '../../../../src/services/blockchain/ViemBlockchainService.js';
import {
  SUPPORTED_CHAIN_ID,
  TEST_ADDRESS,
  TEST_EIP712_TYPED_DATA,
  TEST_PRIVATE_KEY,
} from '../../../helpers/testData.js';

describe('isSmartAccount', () => {
  it('should return true for valid SmartAccount', () => {
    const mockSmartAccount = {
      type: 'smart',
      getAddress: vi.fn(),
      signTypedData: vi.fn(),
      client: {},
    };
    expect(isSmartAccount(mockSmartAccount)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isSmartAccount(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isSmartAccount(undefined)).toBe(false);
  });

  it('should return false for object without type: "smart"', () => {
    const account = {
      type: 'local',
      getAddress: vi.fn(),
      signTypedData: vi.fn(),
      client: {},
    };
    expect(isSmartAccount(account)).toBe(false);
  });

  it('should return false for object without client', () => {
    const account = {
      type: 'smart',
      getAddress: vi.fn(),
      signTypedData: vi.fn(),
    };
    expect(isSmartAccount(account)).toBe(false);
  });

  it('should return false for WalletClient', () => {
    const mockProvider = createMockEIP1193Provider(421614, '0x' + 'ab'.repeat(32));
    const walletClient = createWalletClient({
      transport: custom(mockProvider),
    });
    expect(isSmartAccount(walletClient)).toBe(false);
  });
});

describe('ViemBlockchainService', () => {
  const mockProvider = createMockEIP1193Provider(
    SUPPORTED_CHAIN_ID,
    TEST_PRIVATE_KEY
  );

  const testCases = [
    {
      name: 'EIP-1193 provider',
      client: createWalletClient({
        transport: custom(mockProvider),
      }),
    },
    {
      name: 'Local signer',
      client: createWalletClient({
        account: privateKeyToAccount(TEST_PRIVATE_KEY),
        transport: custom(mockProvider),
      }),
    },
  ];

  for (const { name, client } of testCases) {
    describe(`with ${name}`, () => {
      const blockchainService = new ViemBlockchainService(client);

      describe('getChainId', () => {
        it('should return the correct chainId', async () => {
          const chainId = await blockchainService.getChainId();
          expect(chainId).toBe(SUPPORTED_CHAIN_ID);
        });
      });

      describe('getAddress', () => {
        it('should return the correct address', async () => {
          const address = await blockchainService.getAddress();
          expect(address).toBe(TEST_ADDRESS);
        });
      });

      describe('signTypedData', () => {
        it('should sign typed data correctly', async () => {
          const signature = await blockchainService.signTypedData(
            TEST_EIP712_TYPED_DATA
          );
          expect(signature).toMatch(/0x[a-fA-F0-9]{130}/);
        });
      });

      describe('readContract', () => {
        it('should apply parameters correctly', async () => {
          // Mock a simple contract with a view function that takes parameters
          const contractAddress = '0x0000000000000000000000000000000000000001';
          const abiFunctionFragment = {
            name: 'getValueWithParams',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              {
                internalType: 'uint256',
                name: 'inputValue',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'inputAddress',
                type: 'address',
              },
            ],
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
          } as const;
          // Set the mock provider to return a specific value based on input
          mockProvider.mocks.call.mockReturnValue('0x' + '00'.repeat(32));

          const inputs: [bigint, string] = [
            42n,
            '0x1234567890abcdef1234567890abcdef12345678',
          ];

          await blockchainService.readContract(
            contractAddress,
            abiFunctionFragment,
            inputs
          );
          expect(mockProvider.mocks.call).toHaveBeenCalledWith(
            expect.objectContaining({
              data: '0x2e2d028e000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000001234567890abcdef1234567890abcdef12345678',
              to: '0x0000000000000000000000000000000000000001',
              // other call parameters such as from can be ignored
            })
          );
        });

        it('should read contract with single output correctly', async () => {
          // Mock a simple contract with a view function
          const contractAddress = '0x0000000000000000000000000000000000000001';
          const abiFunctionFragment = {
            name: 'getValue',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
          } as const;
          // Set the mock provider to return a specific value
          mockProvider.mocks.call.mockResolvedValue(
            '0x0000000000000000000000000000000000000000000000000000000000000000'
          );
          const result = await blockchainService.readContract(
            contractAddress,
            abiFunctionFragment,
            []
          );
          expect(typeof result).toBe('bigint');
        });

        it('should read contract with multiple outputs correctly', async () => {
          // Mock a simple contract with a view function
          const contractAddress = '0x0000000000000000000000000000000000000001';
          const abiFunctionFragment = {
            name: 'getValue',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
          } as const;
          // Set the mock provider to return a specific value (two uint256 values)
          mockProvider.mocks.call.mockResolvedValue(
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
          );
          const result = await blockchainService.readContract(
            contractAddress,
            abiFunctionFragment,
            []
          );
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(2);
          expect(typeof result[0]).toBe('bigint');
          expect(typeof result[1]).toBe('bigint');
        });

        it('should read contract with struct output correctly', async () => {
          // Mock a simple contract with a view function
          const contractAddress = '0x0000000000000000000000000000000000000001';
          const abiFunctionFragment = {
            name: 'getValue',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [
              {
                components: [
                  {
                    internalType: 'uint256',
                    name: 'value1',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'value2',
                    type: 'uint256',
                  },
                ],
                internalType: 'struct TestStruct',
                name: '',
                type: 'tuple',
              },
            ],
          } as const;
          // Set the mock provider to return a specific value (two uint256 values)
          mockProvider.mocks.call.mockResolvedValue(
            '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
          );
          const result = await blockchainService.readContract(
            contractAddress,
            abiFunctionFragment,
            []
          );
          expect(typeof result).toBe('object');
          expect(typeof result.value1).toBe('bigint');
          expect(typeof result.value2).toBe('bigint');
        });
      });
    });
  }

  describe('lazy viem loading (getViemModule)', () => {
    const mockProvider = createMockEIP1193Provider(
      SUPPORTED_CHAIN_ID,
      TEST_PRIVATE_KEY
    );

    const contractAddress = '0x0000000000000000000000000000000000000001';
    const abiFunctionFragment = {
      name: 'getValue',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    } as const;

    beforeEach(() => {
      // reset static cache before each test
      // eslint-disable-next-line unicorn/no-null
      ViemBlockchainService['viemModule'] = null;
      mockProvider.mocks.call.mockResolvedValue('0x' + '00'.repeat(32));
    });

    it('should not load viem module at instantiation', () => {
      expect(ViemBlockchainService['viemModule']).toBeNull();
      // eslint-disable-next-line sonarjs/constructor-for-side-effects
      new ViemBlockchainService(
        createWalletClient({
          transport: custom(mockProvider),
        })
      );
      expect(ViemBlockchainService['viemModule']).toBeNull();
    });

    it('should load viem module on first readContract call', async () => {
      const service = new ViemBlockchainService(
        createWalletClient({
          transport: custom(mockProvider),
        })
      );

      expect(ViemBlockchainService['viemModule']).toBeNull();

      await service.readContract(contractAddress, abiFunctionFragment, []);

      expect(ViemBlockchainService['viemModule']).not.toBeNull();
      expect(ViemBlockchainService['viemModule']?.publicActions).toBeDefined();
    });

    it('should cache viem module across multiple calls', async () => {
      const service = new ViemBlockchainService(
        createWalletClient({
          transport: custom(mockProvider),
        })
      );

      await service.readContract(contractAddress, abiFunctionFragment, []);
      const cachedModule1 = ViemBlockchainService['viemModule'];

      await service.readContract(contractAddress, abiFunctionFragment, []);
      const cachedModule2 = ViemBlockchainService['viemModule'];

      // same reference = same cached module
      expect(cachedModule1).toBe(cachedModule2);
    });

    it('should share cached module between instances', async () => {
      const service1 = new ViemBlockchainService(
        createWalletClient({
          transport: custom(mockProvider),
        })
      );
      const service2 = new ViemBlockchainService(
        createWalletClient({
          transport: custom(mockProvider),
        })
      );

      await service1.readContract(contractAddress, abiFunctionFragment, []);
      const moduleFromService1 = ViemBlockchainService['viemModule'];

      await service2.readContract(contractAddress, abiFunctionFragment, []);
      const moduleFromService2 = ViemBlockchainService['viemModule'];

      // static cache shared between instances
      expect(moduleFromService1).toBe(moduleFromService2);
    });
  });

  describe('error handling', () => {
    describe('getChainId', () => {
      it('should throw wrapped error when provider fails', async () => {
        const failingClient = createWalletClient({
          transport: custom({
            request: vi.fn().mockRejectedValue(new Error('RPC error')),
          }),
        });
        const service = new ViemBlockchainService(failingClient);

        try {
          await service.getChainId();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get chain ID');

          const cause = (error as Error).cause as Error & { details?: string };
          expect(cause).toBeDefined();
          expect(cause.details).toBe('RPC error');
        }
      });
    });

    describe('getAddress', () => {
      it('should throw wrapped error when no accounts', async () => {
        const noAccountsClient = createWalletClient({
          transport: custom({
            request: vi.fn().mockImplementation(({ method }) => {
              if (
                method === 'eth_accounts' ||
                method === 'eth_requestAccounts'
              ) {
                return Promise.resolve([]);
              }
              throw new Error(`Unexpected method: ${method}`);
            }),
          }),
        });
        const service = new ViemBlockchainService(noAccountsClient);

        try {
          await service.getAddress();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get address');

          const cause = (error as Error).cause as Error;
          expect(cause).toBeDefined();
          expect(cause.message).toBe('No connected account');
        }
      });
    });

    describe('signTypedData', () => {
      it('should throw wrapped error when signing fails', async () => {
        const failingClient = createWalletClient({
          transport: custom({
            request: vi.fn().mockImplementation(({ method }) => {
              if (
                method === 'eth_accounts' ||
                method === 'eth_requestAccounts'
              ) {
                return Promise.resolve([TEST_ADDRESS]);
              }
              if (method === 'eth_signTypedData_v4') {
                return Promise.reject(new Error('User rejected'));
              }
              throw new Error(`Unexpected method: ${method}`);
            }),
          }),
        });
        const service = new ViemBlockchainService(failingClient);

        try {
          await service.signTypedData(TEST_EIP712_TYPED_DATA);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to sign typed data');

          const cause = (error as Error).cause as Error & { details?: string };
          expect(cause).toBeDefined();
          expect(cause.details).toBe('User rejected');
        }
      });
    });

    describe('readContract', () => {
      it('should throw wrapped error when contract read fails', async () => {
        const mockProvider = createMockEIP1193Provider(
          SUPPORTED_CHAIN_ID,
          TEST_PRIVATE_KEY
        );
        const client = createWalletClient({
          transport: custom(mockProvider),
        });
        const service = new ViemBlockchainService(client);

        const abiFunctionFragment = {
          name: 'getValue',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
        } as const;
        mockProvider.mocks.call.mockResolvedValue('0xdeadbeef'); // invalid data for uint256 to cause decoding error

        await expect(
          service.readContract(
            '0x0000000000000000000000000000000000000001',
            abiFunctionFragment,
            []
          )
        ).rejects.toThrow(
          new Error(
            'Failed to read contract at 0x0000000000000000000000000000000000000001 (method: getValue, parameters: [])'
          )
        );
      });
    });
  });

  describe('with SmartAccount (ERC-4337)', () => {
    /**
     * Creates a mock Viem SmartAccount for testing
     */
    function createMockViemSmartAccount() {
      const mockProvider = createMockEIP1193Provider(
        SUPPORTED_CHAIN_ID,
        TEST_PRIVATE_KEY
      );
      return {
        type: 'smart' as const,
        getAddress: vi.fn().mockResolvedValue(TEST_ADDRESS),
        signTypedData: vi.fn().mockResolvedValue('0x' + 'ab'.repeat(65)),
        client: {
          chain: { id: SUPPORTED_CHAIN_ID },
          getChainId: vi.fn().mockResolvedValue(SUPPORTED_CHAIN_ID),
          extend: vi.fn().mockImplementation((actions) => ({
            ...actions,
            readContract: vi.fn().mockResolvedValue(true),
          })),
          request: mockProvider.request,
        },
      };
    }

    it('should accept SmartAccount in constructor', () => {
      const mockSmartAccount = createMockViemSmartAccount();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service = new ViemBlockchainService(mockSmartAccount as any);
      expect(service).toBeInstanceOf(ViemBlockchainService);
    });

    it('should return Smart Account address from getAddress', async () => {
      const mockSmartAccount = createMockViemSmartAccount();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service = new ViemBlockchainService(mockSmartAccount as any);

      const address = await service.getAddress();

      expect(address).toBe(TEST_ADDRESS);
      expect(mockSmartAccount.getAddress).toHaveBeenCalled();
    });

    it('should return chain ID from SmartAccount client', async () => {
      const mockSmartAccount = createMockViemSmartAccount();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service = new ViemBlockchainService(mockSmartAccount as any);

      const chainId = await service.getChainId();

      expect(chainId).toBe(SUPPORTED_CHAIN_ID);
    });

    it('should sign typed data using SmartAccount', async () => {
      const mockSmartAccount = createMockViemSmartAccount();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service = new ViemBlockchainService(mockSmartAccount as any);

      const signature = await service.signTypedData(TEST_EIP712_TYPED_DATA);

      expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(mockSmartAccount.signTypedData).toHaveBeenCalledWith({
        domain: TEST_EIP712_TYPED_DATA.domain,
        types: TEST_EIP712_TYPED_DATA.types,
        primaryType: TEST_EIP712_TYPED_DATA.primaryType,
        message: TEST_EIP712_TYPED_DATA.message,
      });
    });
  });
});
