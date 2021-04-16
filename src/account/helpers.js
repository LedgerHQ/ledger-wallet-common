// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import type {
  AccountLike,
  AccountLikeArray,
  Account,
  Unit,
  SubAccount,
  TokenCurrency,
} from "../types";
import { getEnv } from "../env";
import { encodeTokenAccountId } from "./accountId";
import { emptyHistoryCache } from "./balanceHistoryCache";
import { isAccountDelegating } from "../families/tezos/bakers";

// by convention, a main account is the top level account
// in case of an Account is the account itself
// in case of a TokenAccount it's the parentAccount
export const getMainAccount = (
  account: AccountLike,
  parentAccount: ?Account
): Account => {
  const mainAccount = account.type === "Account" ? account : parentAccount;
  invariant(mainAccount, "an account is expected");
  return mainAccount;
};

export const getAccountCurrency = (account: AccountLike) => {
  switch (account.type) {
    case "Account":
    case "ChildAccount":
      return account.currency;
    case "TokenAccount":
      return account.token;
    default:
      throw new Error("invalid account.type=" + account.type);
  }
};

export const getAccountUnit = (account: AccountLike): Unit => {
  switch (account.type) {
    case "Account":
      return account.unit;
    case "TokenAccount":
      return account.token.units[0];
    case "ChildAccount":
      return account.currency.units[0];
    default:
      throw new Error("invalid account.type=" + account.type);
  }
};

export const getAccountName = (account: AccountLike): string => {
  switch (account.type) {
    case "Account":
    case "ChildAccount":
      return account.name;
    case "TokenAccount":
      return account.token.name;
    default:
      throw new Error("invalid account.type=" + account.type);
  }
};

export const getAccountSpendableBalance = (account: AccountLike): BigNumber => {
  switch (account.type) {
    case "Account":
    case "TokenAccount":
      return account.spendableBalance;
    case "ChildAccount":
      return account.balance;
    default:
      throw new Error("invalid account.type=" + account.type);
  }
};

export const isAccountEmpty = (a: AccountLike): boolean => {
  if (
    a.type === "Account" &&
    a.currency.id === "tron" &&
    a.tronResources &&
    a.tronResources.bandwidth.freeLimit === 0
  ) {
    return true;
  }
  const hasSubAccounts =
    a.type === "Account" && a.subAccounts && a.subAccounts.length;
  return a.operationsCount === 0 && a.balance.isZero() && !hasSubAccounts;
};

export function areAllOperationsLoaded(account: AccountLike) {
  if (account.operationsCount !== account.operations.length) {
    return false;
  }
  if (account.type === "Account" && account.subAccounts) {
    return account.subAccounts.every(areAllOperationsLoaded);
  }
  return true;
}

export const isAccountBalanceSignificant = (a: AccountLike): boolean =>
  a.balance.gt(100); // in future, could be a per currency thing

// clear account to a bare minimal version that can be restored via sync
// will preserve the balance to avoid user panic
export function clearAccount<T: AccountLike>(account: T): T {
  if (account.type === "TokenAccount") {
    return {
      ...account,
      operations: [],
      pendingOperations: [],
    };
  }

  if (account.type === "ChildAccount") {
    return {
      ...account,
      operations: [],
      pendingOperations: [],
    };
  }

  const copy = {
    ...account,
    tronResources: account.tronResources && {
      ...account.tronResources,
      cacheTransactionInfoById: {},
    },
    lastSyncDate: new Date(0),
    operations: [],
    pendingOperations: [],
    subAccounts: account.subAccounts && account.subAccounts.map(clearAccount),
  };

  delete copy.balanceHistory;

  return copy;
}

export function findSubAccountById(account: Account, id: string): ?SubAccount {
  return (account.subAccounts || []).find((a) => a.id === id);
}

// get the token accounts of an account, ignoring those that are zero IF user don't want them
export function listSubAccounts(account: Account): SubAccount[] {
  const accounts = account.subAccounts || [];
  if (getEnv("HIDE_EMPTY_TOKEN_ACCOUNTS")) {
    return accounts.filter((a) => !a.balance.isZero());
  }
  return accounts;
}

export type FlattenAccountsOptions = {
  enforceHideEmptySubAccounts?: boolean,
};

export function flattenAccounts(
  topAccounts: AccountLikeArray,
  o: FlattenAccountsOptions = {}
): AccountLike[] {
  const accounts = [];
  for (let i = 0; i < topAccounts.length; i++) {
    const account = topAccounts[i];
    accounts.push(account);
    if (account.type === "Account") {
      const subAccounts = o.enforceHideEmptySubAccounts
        ? listSubAccounts(account)
        : account.subAccounts || [];
      for (let j = 0; j < subAccounts.length; j++) {
        accounts.push(subAccounts[j]);
      }
    }
  }
  return accounts;
}

export const shortAddressPreview = (addr: string, target: number = 20) => {
  const slice = Math.floor((target - 3) / 2);
  return addr.length < target - 3
    ? addr
    : `${addr.slice(0, slice)}...${addr.slice(addr.length - slice)}`;
};

export const isAccountBalanceUnconfirmed = (account: AccountLike) =>
  account.pendingOperations.some(
    (op) => !account.operations.find((o) => o.hash === op.hash)
  ) || account.operations.some((op) => !op.blockHeight);

export const isUpToDateAccount = (account: ?Account) => {
  if (!account) return true;
  const { lastSyncDate, currency } = account;
  const { blockAvgTime } = currency;
  if (!blockAvgTime) return true;
  const outdated =
    Date.now() - (lastSyncDate || 0) >
    blockAvgTime * 1000 + getEnv("SYNC_OUTDATED_CONSIDERED_DELAY");
  return !outdated;
};

export const getVotesCount = (
  account: AccountLike,
  parentAccount: ?Account
) => {
  const mainAccount = getMainAccount(account, parentAccount);
  // FIXME find a way to make it per family?
  if (mainAccount.currency.id === "tezos") {
    return isAccountDelegating(account) ? 1 : 0;
  } else if (mainAccount.tronResources) {
    return mainAccount.tronResources.votes.length;
  } else if (mainAccount.cosmosResources) {
    return mainAccount.cosmosResources.delegations.length;
  }
  return 0;
};

export const makeEmptyTokenAccount = (
  account: Account,
  token: TokenCurrency
): SubAccount => ({
  type: "TokenAccount",
  id: account.id + "+" + token.contractAddress,
  parentId: account.id,
  token,
  balance: BigNumber(0),
  spendableBalance: BigNumber(0),
  operationsCount: 0,
  creationDate: new Date(),
  operations: [],
  pendingOperations: [],
  starred: false,
  swapHistory: [],
  balanceHistoryCache: emptyHistoryCache,
});

/**
 * Enhance an account to force token accounts presence
 */
export const accountWithMandatoryTokens = (
  account: Account,
  tokenCurrencies: TokenCurrency[]
): Account => {
  const { subAccounts } = account;
  if (!subAccounts) return account;
  const existingTokens = subAccounts
    .map((a) => a.type === "TokenAccount" && a.token)
    .filter(Boolean);
  const addition = tokenCurrencies
    .filter(
      (t) =>
        // token of the same currency
        t.parentCurrency === account.currency &&
        // not yet in the sub accounts
        !existingTokens.includes(t)
    )
    .map((token) => ({
      type: "TokenAccount",
      id: encodeTokenAccountId(account.id, token),
      parentId: account.id,
      token,
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
      operationsCount: 0,
      creationDate: new Date(),
      operations: [],
      pendingOperations: [],
      starred: false,
      swapHistory: [],
      balanceHistoryCache: emptyHistoryCache,
    }));

  if (addition.length === 0) return account;

  return {
    ...account,
    subAccounts: subAccounts.concat(addition),
  };
};

/**
 * Patch account to enforce the removal of a blacklisted token
 */
export const withoutToken = (account: Account, tokenId: string): Account => {
  const { subAccounts } = account;
  if (!subAccounts) return account;
  const tokenAccount = subAccounts.find(
    (a) => a.type === "TokenAccount" && a.token.id === tokenId
  );
  if (!tokenAccount) return account;
  return {
    ...account,
    subAccounts: subAccounts.filter((sa) => sa.id !== tokenAccount.id),
  };
};

/**
 * Find matching pair of subAccount/parentAccount for a given token curency
 * if no subAccount found will return parentAccount or null if no matches found
 */
export const findTokenAccountByCurrency = (
  tokenCurrency: TokenCurrency,
  accounts: Account[]
): ?{ account?: SubAccount, parentAccount: Account } => {
  const parentCurrency = tokenCurrency.parentCurrency;
  for (const parentAccount of accounts) {
    if (parentAccount.subAccounts && parentAccount.subAccounts.length > 0) {
      for (const account of parentAccount.subAccounts) {
        const c = getAccountCurrency(account);
        if (c.id === tokenCurrency.id) {
          // if token currency matches subAccount return couple account/parentAccount
          return { account, parentAccount };
        }
      }
    }
    const parentC = getAccountCurrency(parentAccount);
    if (parentC.id === parentCurrency.id) {
      // if no token currency matches but parent matches return parentAccount
      return { parentAccount };
    }
  }
  return null; // else return nothing
};
