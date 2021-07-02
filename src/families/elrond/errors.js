// @flow
import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * Elrond error thrown on a specifc check done on a transaction amount
 */
export const ElrondSpecificError = createCustomErrorClass(
  "ElrondSpecificError"
);
