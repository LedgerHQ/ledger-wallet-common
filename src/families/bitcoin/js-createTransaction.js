// @flow
import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
const createTransaction = () => ({
  family: "bitcoin",
  amount: BigNumber(0),
  utxoStrategy: {
    strategy: 0,
    pickUnconfirmedRBF: false,
    excludeUTXOs: [],
  },
  recipient: "",
  rbf: false,
  feePerByte: null,
  fees: BigNumber(0),
  networkInfo: null,
  useAllAmount: false,
  feesStrategy: "medium",
});

export default createTransaction;
