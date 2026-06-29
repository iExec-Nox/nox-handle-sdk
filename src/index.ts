export type * from './types/publicTypes.js';

export { createHandleClient } from './factories/createHandleClient.js';
export { createEthersHandleClient } from './factories/createEthersHandleClient.js';
export { createViemHandleClient } from './factories/createViemHandleClient.js';
export { isValidHandleFormat } from './utils/validators.js';

export {
  NotYetComputedHandleError,
  UnknownHandleError,
  GatewayTrustError,
} from './utils/error.js';
