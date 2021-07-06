// @flow
import type { Transaction } from "./types";
import type { Account } from "../../types";

const getTransactionParams = (a: Account, t: Transaction) => {
  switch (t.mode) {
    case "send":
      return t.useAllAmount
        ? {
            method: "transferAll",
            args: {
              dest: t.recipient
            }
          }
        : {
            method: "transfer",
            args: {
              dest: t.recipient,
              value: t.amount.toString()
            }
          };
    default:
      throw new Error("Unknown mode in transaction");
  }
};

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: Account, t: Transaction) => {
  const address = a.freshAddress;
  const params = getTransactionParams(a, t);

  const unsigned = {
    address,
    params
  };

  // Will likely be a call to Hedera SDK
  return JSON.stringify(unsigned);
};
