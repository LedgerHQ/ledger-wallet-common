// @flow
import invariant from "invariant";
import type { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  NotEnoughBalanceToDelegate,
  NotEnoughBalanceInParentAccount,
  FeeNotLoaded,
  FeeTooHigh,
  NotSupportedLegacyAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecommendSubAccountsToEmpty,
  RecommendUndelegation,
} from "@ledgerhq/errors";
import type {
  CurrencyBridge,
  AccountBridge,
  SignOperationEvent,
  Account,
} from "../../../types";
import {
  makeSync,
  makeScanAccounts,
  makeAccountBridgeReceive,
} from "../../../bridge/jsHelpers";
import { getMainAccount, isAccountBalanceSignificant } from "../../../account";
import { patchOperationWithHash } from "../../../operation";
import { getCryptoCurrencyById } from "../../../currencies";
import type { Transaction, NetworkInfo } from "../types";
import { getAccountShape } from "../synchronisation";
import { inferDynamicRange } from "../../../range";
import { validateRecipient } from "../../../bridge/shared";
import { makeLRUCache } from "../../../cache";
import { fetchAllBakers, hydrateBakers, isAccountDelegating } from "../bakers";
import { getEnv } from "../../../env";
import { signOperation } from "../signOperation";

const receive = makeAccountBridgeReceive();

const createTransaction = () => ({
  family: "tezos",
  mode: "send",
  amount: BigNumber(0),
  fees: null,
  gasLimit: null,
  storageLimit: null,
  recipient: "",
  networkInfo: null,
  useAllAmount: false,
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = async (a, t) => {
  // FIXME
  const estimatedFees = BigNumber(0);
  const errors = {};
  const warnings = {};
  const result = {
    errors,
    warnings,
    estimatedFees,
    amount: BigNumber(0),
    totalSpent: BigNumber(0),
  };
  return Promise.resolve(result);
};

const prepareTransaction = async (a, t) => {
  // FIXME
  return Promise.resolve(t);
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    // this seed is empty (worse case scenario is to send to new). addr from: 1. eyebrow 2. odor 3. rice 4. attack 5. loyal 6. tray 7. letter 8. harbor 9. resemble 10. sphere 11. system 12. forward 13. onion 14. buffalo 15. crumble
    recipient: transaction?.recipient || "tz1VJitLYB31fEC82efFkLRU4AQUH9QgH3q6",
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const broadcast = async ({
  account,
  signedOperation: { operation, signature },
}) => {
  throw new Error("not implemented");
};

const scanAccounts = makeScanAccounts(getAccountShape);

const sync = makeSync(getAccountShape);

const getPreloadStrategy = (_currency) => ({
  preloadMaxAge: 30 * 1000,
});

const preload = async () => {
  const bakers = await fetchAllBakers();
  return { bakers };
};

const hydrate = (data: mixed) => {
  if (!data || typeof data !== "object") return;
  const { bakers } = data;
  if (!bakers || typeof bakers !== "object" || !Array.isArray(bakers)) return;
  hydrateBakers(bakers);
};

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  estimateMaxSpendable,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
