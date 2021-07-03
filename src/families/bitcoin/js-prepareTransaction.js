// @flow

import invariant from "invariant";

import type { Account } from "../../types";
import type { Transaction, NetworkInfo } from "./types";

import { requiresSatStackReady } from "./satstack";
import { calculateFees } from "./cache";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";

const inferFeePerByte = (t: Transaction, networkInfo: NetworkInfo) => {
  if (t.feesStrategy) {
    const speed = networkInfo.feeItems.items.find(
      (item) => t.feesStrategy === item.speed
    );
    if (!speed) {
      return networkInfo.feeItems.defaultFeePerByte;
    }
    return speed.feePerByte;
  }
  return t.feePerByte || networkInfo.feeItems.defaultFeePerByte;
};

// FIXME Currently getting both "fees per byte" and "fees for transaction": maybe need only one?
const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  if (a.currency.id === "bitcoin") {
    await requiresSatStackReady();
  }
  let networkInfo = t.networkInfo;
  if (!networkInfo) {
    networkInfo = await getAccountNetworkInfo(a);
    invariant(networkInfo.family === "bitcoin", "bitcoin networkInfo expected");
  }

  const feePerByte = inferFeePerByte(t, networkInfo);
  if (
    t.networkInfo === networkInfo &&
    (feePerByte === t.feePerByte || feePerByte.eq(t.feePerByte || 0))
    // nothing changed
  ) {
    return t;
  }

  const fees = await calculateFees({ account: a, transaction: t });

  return {
    ...t,
    networkInfo,
    feePerByte,
    fees,
  };
};

export default prepareTransaction;
