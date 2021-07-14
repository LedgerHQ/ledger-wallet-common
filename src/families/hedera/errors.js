// @flow
import { createCustomErrorClass } from '@ledgerhq/errors';

/**
 * Hedera error thrown on a specific check done on a transaction amount
 */
export const HederaSpecificError = createCustomErrorClass(
  'HederaSpecificError'
);
