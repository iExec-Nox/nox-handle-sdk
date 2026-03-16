import { Wallet, BrowserProvider, type JsonRpcProvider } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EthersBlockchainService } from '../../../../src/services/blockchain/EthersBlockchainService.js';
import {
  createMockEIP1193Provider,
  createMockProvider,
} from '../../../helpers/mocks.js';
import {
  SUPPORTED_CHAIN_ID,
  TEST_ADDRESS,
  TEST_EIP712_TYPED_DATA,
  TEST_PRIVATE_KEY,
} from '../../../helpers/testData.js';

describe('EthersBlockchainService', () => {
  const mockJsonRpcProvider = createMockProvider(SUPPORTED_CHAIN_ID);
  const mockEIP1193Provider = createMockEIP1193Provider(
    SUPPORTED_CHAIN_ID,
    TEST_PRIVATE_KEY
  );

  const testCases = [
    {
      name: 'AbstractSigner',
      client: new Wallet(TEST_PRIVATE_KEY, mockJsonRpcProvider),
      mockProvider: mockJsonRpcProvider,
    },
    {
      name: 'BrowserProvider',
      client: new BrowserProvider(mockEIP1193Provider),
      mockProvider: mockEIP1193Provider,
    },
  ];

  for (const { name, client, mockProvider } of testCases) {
    describe(`with ${name}`, () => {
      const blockchainService = new EthersBlockchainService(client);
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
          expect(mockProvider.mocks.call).toHaveBeenCalledWith({
            data: '0x2e2d028e000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000001234567890abcdef1234567890abcdef12345678',
            to: '0x0000000000000000000000000000000000000001',
          });
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

  describe('lazy ethers loading (getEthersModule)', () => {
    const mockProvider = createMockProvider(SUPPORTED_CHAIN_ID);

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
      EthersBlockchainService['ethersModule'] = null;
      mockProvider.mocks.call.mockResolvedValue('0x' + '00'.repeat(32));
    });

    it('should not load ethers module at instantiation', () => {
      expect(EthersBlockchainService['ethersModule']).toBeNull();
      // eslint-disable-next-line sonarjs/constructor-for-side-effects
      new EthersBlockchainService(new Wallet(TEST_PRIVATE_KEY, mockProvider));
      expect(EthersBlockchainService['ethersModule']).toBeNull();
    });

    it('should load ethers module on first readContract call', async () => {
      const service = new EthersBlockchainService(
        new Wallet(TEST_PRIVATE_KEY, mockProvider)
      );

      expect(EthersBlockchainService['ethersModule']).toBeNull();

      await service.readContract(contractAddress, abiFunctionFragment, []);

      expect(EthersBlockchainService['ethersModule']).not.toBeNull();
      expect(EthersBlockchainService['ethersModule']?.Contract).toBeDefined();
    });

    it('should cache ethers module across multiple calls', async () => {
      const service = new EthersBlockchainService(
        new Wallet(TEST_PRIVATE_KEY, mockProvider)
      );

      await service.readContract(contractAddress, abiFunctionFragment, []);
      const cachedModule1 = EthersBlockchainService['ethersModule'];

      await service.readContract(contractAddress, abiFunctionFragment, []);
      const cachedModule2 = EthersBlockchainService['ethersModule'];

      // same reference = same cached module
      expect(cachedModule1).toBe(cachedModule2);
    });

    it('should share cached module between instances', async () => {
      const service1 = new EthersBlockchainService(
        new Wallet(TEST_PRIVATE_KEY, mockProvider)
      );
      const service2 = new EthersBlockchainService(
        new Wallet(TEST_PRIVATE_KEY, mockProvider)
      );

      await service1.readContract(contractAddress, abiFunctionFragment, []);
      const moduleFromService1 = EthersBlockchainService['ethersModule'];

      await service2.readContract(contractAddress, abiFunctionFragment, []);
      const moduleFromService2 = EthersBlockchainService['ethersModule'];

      // static cache shared between instances
      expect(moduleFromService1).toBe(moduleFromService2);
    });
  });

  describe('error handling', () => {
    describe('getChainId', () => {
      it('should throw wrapped error when provider fails', async () => {
        const failingProvider = {
          getNetwork: vi.fn().mockRejectedValue(new Error('Network error')),
        } as unknown as JsonRpcProvider;
        const signer = new Wallet(TEST_PRIVATE_KEY, failingProvider);
        const service = new EthersBlockchainService(signer);

        try {
          await service.getChainId();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get chain ID');

          const cause = (error as Error).cause as Error;
          expect(cause).toBeInstanceOf(Error);
          expect(cause.message).toBe('Network error');
        }
      });
    });

    describe('getAddress', () => {
      it('should throw wrapped error when signer fails', async () => {
        const browserProvider = new BrowserProvider({
          request: vi.fn().mockRejectedValue(new Error('No accounts')),
        });
        const service = new EthersBlockchainService(browserProvider);

        try {
          await service.getAddress();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to get address');

          const cause1 = (error as Error).cause as Error;
          expect(cause1).toBeInstanceOf(Error);
          expect(cause1.message).toBe(
            'Failed to get signer from BrowserProvider'
          );

          const cause2 = cause1.cause as Error & {
            error?: { message: string };
          };
          expect(cause2).toBeDefined();
          expect(cause2.error?.message).toBe('No accounts');
        }
      });
    });

    describe('signTypedData', () => {
      it('should throw wrapped error when signing fails', async () => {
        const browserProvider = new BrowserProvider({
          request: vi.fn().mockImplementation(({ method }) => {
            if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
              return Promise.resolve([TEST_ADDRESS]);
            }
            if (method === 'eth_signTypedData_v4') {
              return Promise.reject(new Error('User rejected'));
            }
            throw new Error(`Unexpected method: ${method}`);
          }),
        });
        const service = new EthersBlockchainService(browserProvider);

        try {
          await service.signTypedData(TEST_EIP712_TYPED_DATA);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Failed to sign typed data');

          const cause = (error as Error).cause as Error & {
            error?: { message: string };
          };
          expect(cause).toBeDefined();
          expect(cause.error?.message).toBe('User rejected');
        }
      });
    });

    describe('readContract', () => {
      it('should throw wrapped error when contract read fails', async () => {
        const mockProvider = createMockProvider(SUPPORTED_CHAIN_ID);
        const signer = new Wallet(TEST_PRIVATE_KEY, mockProvider);
        const service = new EthersBlockchainService(signer);

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
});
