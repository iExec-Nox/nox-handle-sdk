/**
 * Error thrown when the subgraph is out of sync with the current block number.
 */
export class SubgraphOutOfSyncError extends Error {
  currentBlock: number;
  subgraphBlock: number;
  lag: number;
  constructor({
    currentBlock,
    subgraphBlock,
  }: {
    currentBlock: number;
    subgraphBlock: number;
  }) {
    super(
      `Subgraph is out of sync. Current block: ${currentBlock}, Subgraph block: ${subgraphBlock}`
    );
    this.name = 'SubgraphOutOfSyncError';
    this.currentBlock = currentBlock;
    this.subgraphBlock = subgraphBlock;
    this.lag = currentBlock - subgraphBlock;
  }
}

/**
 * Error thrown when a handle is queried but has not yet been computed by runner.
 */
export class NotYetComputedHandleError extends Error {
  handle: string;
  constructor(handle: string) {
    super(`Handle with ID ${handle} has not yet been computed.`);
    this.name = 'NotYetComputedHandleError';
    this.handle = handle;
  }
}

/**
 * Error thrown when a handle is queried but was never seen onchain.
 */
export class UnknownHandleError extends Error {
  handle: string;
  constructor(handle: string) {
    super(`Handle with ID ${handle} is unknown.`);
    this.name = 'UnknownHandleError';
    this.handle = handle;
  }
}

/**
 * Custom error class for gateway trust / attestation failures.
 *
 * This error is thrown when the SDK detects that a gateway response cannot be trusted (e.g. signature verification fails, or the response handle does not match the requested handle).
 */
export class GatewayTrustError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GatewayTrustError';
  }
}
