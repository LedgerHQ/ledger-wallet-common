// @flow

import { BigNumber } from "bignumber.js";

import type { Account } from "../../types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { getEnv } from "../../env";

import type {
  BitcoinResourcesRaw,
  BitcoinResources,
  BitcoinInputRaw,
  BitcoinInput,
  BitcoinOutputRaw,
  BitcoinOutput,
  Transaction,
  TransactionRaw,
  FeeItems,
  FeeItemsRaw,
} from "./types";
import { bitcoinPickingStrategy } from "./types";

export function toBitcoinInputRaw({
  address,
  value,
  previousTxHash,
  previousOutputIndex,
}: BitcoinInput): BitcoinInputRaw {
  return [
    address,
    value ? value.toString() : undefined,
    previousTxHash,
    previousOutputIndex,
  ];
}

export function fromBitcoinInputRaw([
  address,
  value,
  previousTxHash,
  previousOutputIndex,
]: BitcoinInputRaw): BitcoinInput {
  return {
    address: address || undefined,
    value: value ? BigNumber(value) : undefined,
    previousTxHash: previousTxHash || undefined,
    previousOutputIndex,
  };
}

export function toBitcoinOutputRaw({
  hash,
  outputIndex,
  blockHeight,
  address,
  path,
  value,
  rbf,
}: BitcoinOutput): BitcoinOutputRaw {
  return [
    hash,
    outputIndex,
    blockHeight,
    address,
    path,
    value.toString(),
    rbf ? 1 : 0,
  ];
}

export function fromBitcoinOutputRaw([
  hash,
  outputIndex,
  blockHeight,
  address,
  path,
  value,
  rbf,
]: BitcoinOutputRaw): BitcoinOutput {
  return {
    hash,
    outputIndex,
    blockHeight: blockHeight || undefined,
    address: address || undefined,
    path: path || undefined,
    value: BigNumber(value),
    rbf: !!rbf,
  };
}

export function toBitcoinResourcesRaw(
  r: BitcoinResources
): BitcoinResourcesRaw {
  return {
    utxos: r.utxos.map(toBitcoinOutputRaw),
  };
}

export function fromBitcoinResourcesRaw(
  r: BitcoinResourcesRaw
): BitcoinResources {
  return {
    utxos: r.utxos.map(fromBitcoinOutputRaw),
  };
}

const fromFeeItemsRaw = (fir: FeeItemsRaw): FeeItems => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: BigNumber(fi.feePerByte),
  })),
  defaultFeePerByte: BigNumber(fir.defaultFeePerByte),
});

const toFeeItemsRaw = (fir: FeeItems): FeeItemsRaw => ({
  items: fir.items.map((fi) => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: fi.feePerByte.toString(),
  })),
  defaultFeePerByte: fir.defaultFeePerByte.toString(),
});

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    rbf: tr.rbf,
    utxoStrategy: tr.utxoStrategy,
    family: tr.family,
    feePerByte: tr.feePerByte ? BigNumber(tr.feePerByte) : null,
    fees: tr.fees ? BigNumber(tr.fees) : null,
    networkInfo: tr.networkInfo && {
      family: tr.networkInfo.family,
      feeItems: fromFeeItemsRaw(tr.networkInfo.feeItems),
    },
    feesStrategy: tr.feesStrategy,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    rbf: t.rbf,
    utxoStrategy: t.utxoStrategy,
    family: t.family,
    feePerByte: t.feePerByte ? t.feePerByte.toString() : null,
    fees: t.fees ? t.fees.toString() : null,
    networkInfo: t.networkInfo && {
      family: t.networkInfo.family,
      feeItems: toFeeItemsRaw(t.networkInfo.feeItems),
    },
    feesStrategy: t.feesStrategy,
  };
};

const formatNetworkInfo = (networkInfo: ?{ feeItems: FeeItems }) => {
  if (!networkInfo) return "network info not loaded";
  return `network fees: ${networkInfo.feeItems.items
    .map((i) => i.key + "=" + i.feePerByte.toString())
    .join(", ")}`;
};

export const formatTransaction = (t: Transaction, account: Account): string => {
  const n = getEnv("DEBUG_UTXO_DISPLAY");
  const { excludeUTXOs, strategy, pickUnconfirmedRBF } = t.utxoStrategy;
  const displayAll = excludeUTXOs.length <= n;
  return `
SEND ${
    t.useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountUnit(account), t.amount, {
          showCode: true,
          disableRounding: true,
        })
  }
TO ${t.recipient}
with feePerByte=${
    t.feePerByte ? t.feePerByte.toString() : "?"
  } (${formatNetworkInfo(t.networkInfo)})
${[
  Object.keys(bitcoinPickingStrategy).find(
    (k) => bitcoinPickingStrategy[k] === strategy
  ),
  pickUnconfirmedRBF && "pick-unconfirmed",
  t.rbf && "RBF-enabled",
]
  .filter(Boolean)
  .join(" ")}${excludeUTXOs
    .slice(0, displayAll ? excludeUTXOs.length : n)
    .map((utxo) => `\nexclude ${utxo.hash} @${utxo.outputIndex}`)
    .join("")}`;
};
