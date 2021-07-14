// @flow
import { BigNumber } from "bignumber.js";

import type { Account } from "../../types";
import type { Transaction } from "./types";

import { getFees } from "./api";
import { buildTransaction } from "./js-buildTransaction";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
const getEstimatedFees = async ({
  a,
  t
}: {
  a: Account,
  t: Transaction
}): Promise<BigNumber> => {
  const unsigned = await buildTransaction(a, t);
  const fees = await getFees(unsigned);

  return fees;
};

export default getEstimatedFees;
