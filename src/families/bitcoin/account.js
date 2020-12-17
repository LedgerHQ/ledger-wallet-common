// @flow
import type { Account } from "../../types";
import type { BitcoinOutput, BitcoinInput } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { getEnv } from "../../env";
import { perCoinLogic } from "./transaction";

import {
  fromBitcoinInputRaw,
  fromBitcoinOutputRaw,
  toBitcoinInputRaw,
  toBitcoinOutputRaw,
} from "./serialization";

const sortUTXO = (a, b) => b.value.minus(a.value).toNumber();

function injectGetAddressParams(account: Account) {
  const perCoin = perCoinLogic[account.currency.id];
  if (perCoin && perCoin.injectGetAddressParams) {
    return perCoin.injectGetAddressParams(account);
  }
}

export function formatInput(account: Account, input: BitcoinInput) {
  return `${(input.value
    ? formatCurrencyUnit(account.unit, input.value, {
        showCode: false,
      })
    : ""
  ).padEnd(12)} ${input.address || ""} ${input.previousTxHash || ""}@${
    input.previousOutputIndex
  }`;
}

export function formatOutput(account: Account, o: BitcoinOutput) {
  return [
    formatCurrencyUnit(account.unit, o.value, {
      showCode: false,
    }).padEnd(12),
    o.address,
    o.path,
    o.rbf ? "rbf" : "",
    o.hash,
    `@${o.outputIndex} (${
      o.blockHeight ? account.blockHeight - o.blockHeight : 0
    })`,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatAccountSpecifics(account: Account): string {
  if (!account.bitcoinResources) return "";
  const { utxos } = account.bitcoinResources;
  let str = `\n${utxos.length} UTXOs`;
  const n = getEnv("DEBUG_UTXO_DISPLAY");
  const displayAll = utxos.length <= n;
  str += utxos
    .slice(0)
    .sort(sortUTXO)
    .slice(0, displayAll ? utxos.length : n)
    .map((utxo) => `\n${formatOutput(account, utxo)}`)
    .join("");
  if (!displayAll) {
    str += "\n...";
  }
  return str;
}

export function fromOperationExtraRaw(extra: ?Object) {
  return {
    inputs: extra.inputs ? extra.inputs.map(fromBitcoinInputRaw) : [],
    outputs: extra.inputs ? extra.outputs.map(fromBitcoinOutputRaw) : [],
  };
}

export function toOperationExtraRaw(extra: ?Object) {
  return {
    inputs: extra.inputs ? extra.inputs.map(toBitcoinInputRaw) : [],
    outputs: extra.outputs ? extra.outputs.map(toBitcoinOutputRaw) : [],
  };
}

export default {
  injectGetAddressParams,
  formatAccountSpecifics,
  toOperationExtraRaw,
  fromOperationExtraRaw,
};
