// @flow
import { BigNumber } from "bignumber.js";

import type { Account } from "./../../types";
import type { Transaction, BitcoinInput, BitcoinOutput } from "./types";

// FIXME Does this object make sense?
export type EstimatedFees = {
  estimatedFees: BigNumber,
  value: BigNumber,
  txInputs: BitcoinInput[],
  txOutputs: BitcoinOutput[],
};
const getFeesForTransaction = async ({
  account,
  transaction,
}: {
  account: Account,
  transaction: Transaction,
}): Promise<EstimatedFees> => {
  // TODO

  // Current libcore-based implem:
  /*
  const builded = await buildTransaction(arg);
  if (!builded) return;
  const feesAmount = await builded.getFees();
  if (!feesAmount) {
    throw new Error("getFeesForTransaction: fees should not be undefined");
  }
  const estimatedFees = await libcoreAmountToBigNumber(feesAmount);
  // we don't have a getValue on bitcoin
  const value = BigNumber(0);
  const inputs = await builded.getInputs();
  let txInputs: BitcoinInput[] = await promiseAllBatched(
    4,
    inputs,
    parseBitcoinInput
  );
  const outputs = await builded.getOutputs();
  let txOutputs: BitcoinOutput[] = await promiseAllBatched(
    4,
    outputs,
    parseBitcoinOutput
  );

  const { account } = arg;
  const perCoin = perCoinLogic[account.currency.id];
  if (perCoin) {
    const { syncReplaceAddress } = perCoin;
    if (syncReplaceAddress) {
      txInputs = txInputs.map((i) => ({
        ...i,
        address: syncReplaceAddress(account, i.address),
      }));
      txOutputs = txOutputs.map((o) => ({
        ...o,
        address: o.address && syncReplaceAddress(account, o.address),
      }));
    }
  }

  */

  return {
    estimatedFees: BigNumber(0),
    value: BigNumber(0),
    txInputs: [],
    txOutputs: [],
  };
};

export default getFeesForTransaction;
