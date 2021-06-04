// @flow
import { BigNumber } from "bignumber.js";
import { FIXED_GAS_PRICE, FIXED_DEFAULT_GAS_LIMIT } from "./logic";

/**
 * Fetch the transaction fees for a transaction
 */
const getEstimatedFees = async (): Promise<BigNumber> => {
  // Todo call gas station to get a more accurate tx fee in the future
  let estimateFee = Math.ceil(FIXED_GAS_PRICE * FIXED_DEFAULT_GAS_LIMIT);
  return new BigNumber(estimateFee);
};

export default getEstimatedFees;
