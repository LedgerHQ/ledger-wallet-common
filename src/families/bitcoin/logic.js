// @flow
import cashaddr from "cashaddrjs";
import bchaddr from "bchaddrjs";

import type { Account, CryptoCurrency, CryptoCurrencyIds } from "./../../types";
import type {
  BitcoinOutput,
  BitcoinResources,
  Transaction,
  UtxoStrategy,
} from "./types";

// FIXME A bit fourre-tout, could maybe split in specialized files

// correspond ~ to min relay fees but determined empirically for a tx to be accepted by network
const minFees = {
  bitcoin: 1000,
  bitcoin_gold: 1000,
  pivx: 2000,
  stakenet: 1000,
  stealthcoin: 2000,
  qtum: 4000,
  stratis: 2000,
  vertcoin: 2000,
  viacoin: 2000,
  peercoin: 2000,
};

export const getMinRelayFee = (currency: CryptoCurrency): number =>
  minFees[currency.id] || 0;

export const isValidRecipient = async ({
  currency,
  recipient,
}: {
  currency: CryptoCurrency,
  recipient: string,
}): Promise<?Error> => {
  // TODO

  // Current libcore-based implem:
  /*
    const { currency, recipient } = arg;
    if (!recipient) {
      return Promise.reject(new RecipientRequired(""));
    }
    const custom = customAddressValidationByFamily[arg.currency.family];
    if (custom) {
      const res = await custom(core, arg);
      return res;
    }
    const poolInstance = core.getPoolInstance();
    const currencyCore = await poolInstance.getCurrency(currency.id);
    const value = await core.Address.isValid(recipient, currencyCore);
    if (value) {
      return Promise.resolve(null);
    }

    return Promise.reject(
      new InvalidAddress(null, { currencyName: currency.name })
    );
    */

  return Promise.resolve(null);
};

export const getUTXOCount = (account: Account) => {
  // TODO

  return 0;
};

type UTXOStatus =
  | {
      excluded: true,
      reason: "pickUnconfirmedRBF" | "userExclusion",
    }
  | {
      excluded: false,
    };

export const getUTXOStatus = (
  utxo: BitcoinOutput,
  utxoStrategy: UtxoStrategy
): UTXOStatus => {
  if (!utxoStrategy.pickUnconfirmedRBF && utxo.rbf && !utxo.blockHeight) {
    return { excluded: true, reason: "pickUnconfirmedRBF" };
  }
  if (
    utxoStrategy.excludeUTXOs.some(
      (u) => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex
    )
  ) {
    return { excluded: true, reason: "userExclusion" };
  }
  return { excluded: false };
};

export const isChangeOutput = (output: BitcoinOutput): boolean => {
  if (!output.path) return false;
  const p = output.path.split("/");
  return p[p.length - 2] === "1";
};

const bchExplicit = (str: string): string => {
  const explicit = str.includes(":") ? str : "bitcoincash:" + str;
  try {
    const { type } = cashaddr.decode(explicit);
    if (type === "P2PKH") return explicit;
  } catch (e) {
    // ignore errors
  }
  return str;
};

type CoinLogic = {
  hasExtraData?: boolean,
  hasExpiryHeight?: boolean,
  getAdditionals?: ({ transaction: Transaction }) => string[],
  asLibcoreTransactionRecipient?: (string) => string,
  onScreenTransactionRecipient?: (string) => string,
  postBuildBitcoinResources?: (Account, BitcoinResources) => BitcoinResources,
  syncReplaceAddress?: (existingAccount: ?Account, addr: string) => string,
  injectGetAddressParams?: (Account) => any,
};

const bchToCashaddrAddressWithoutPrefix = (recipient) =>
  recipient ? bchaddr.toCashAddress(recipient).split(":")[1] : recipient;

export const perCoinLogic: { [_: CryptoCurrencyIds]: ?CoinLogic } = {
  zencash: {
    hasExtraData: true, // FIXME (legacy) investigate why we need this here and drop
  },
  zcash: {
    hasExtraData: true,
    hasExpiryHeight: true,
    getAdditionals: () => ["sapling"], // FIXME (legacy) drop in ledgerjs. we always use sapling now for zcash & kmd
  },
  komodo: {
    hasExtraData: true,
    hasExpiryHeight: true,
    getAdditionals: () => ["sapling"], // FIXME (legacy) drop in ledgerjs. we always use sapling now for zcash & kmd
  },
  decred: {
    hasExpiryHeight: true,
  },
  bitcoin_gold: {
    getAdditionals: () => ["bip143"],
  },
  bitcoin_cash: {
    getAdditionals: ({ transaction }) => {
      const additionals = ["bip143"];
      if (bchExplicit(transaction.recipient).startsWith("bitcoincash:")) {
        additionals.push("cashaddr");
      }
      return additionals;
    },

    // due to libcore minimal support, we need to return the explicit format of bitcoincash:.. if it's a P2PKH
    asLibcoreTransactionRecipient: bchExplicit,

    // to represent what happens on the device, which do not display the bitcoincash: prefix
    onScreenTransactionRecipient: (str: string): string => {
      const prefix = "bitcoincash:";
      return str.startsWith(prefix) ? str.slice(prefix.length) : str;
    },

    syncReplaceAddress: (existingAccount, addr) =>
      bchToCashaddrAddressWithoutPrefix(addr),

    injectGetAddressParams: () => ({ forceFormat: "cashaddr" }),
  },
};
