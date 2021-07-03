import type { Account, Operation } from "../../types";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import {
  makeSync,
  makeScanAccounts,
  mergeOps,
} from "../../../bridge/jsHelpers";

import type { TX } from "./api/types";
import { getAccount, getTransactions } from "./api/ledgerApi";

// TODO Map BTC transactions to LL operations
// See src/types/operation.js
function mapTxsToOperations(txs: TX[]): $Shape<Operation>[] {
  // TODO Some additional logic to keep, currently used when mapping 1 tx to 1 operation
  /*
  const hash = await coreTransaction.getHash();

  const shape: $Shape<Operation> = { hash };

  const perCoin = perCoinLogic[currency.id];
  if (perCoin && perCoin.syncReplaceAddress) {
    const { syncReplaceAddress } = perCoin;
    shape.senders = partialOp.senders.map((addr) =>
      syncReplaceAddress(existingAccount, addr)
    );
    shape.recipients = partialOp.recipients.map((addr) =>
      syncReplaceAddress(existingAccount, addr)
    );
  }

  return shape;
  */

  return [];
}

const getAccountShape: GetAccountShape = async (info) => {
  if (a.currency.id === "bitcoin") {
    await requiresSatStackReady();
  }

  const { id, address, initialAccount } = info;

  // TODO Derive Xpub here
  const xpub = "";

  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length
    ? (oldOperations[0].blockHeight || 0) + 1
    : 0;

  const { blockHeight, balance, spendableBalance } = await getAccount(
    address // FIXME address or xpub?
  );

  const newTransactions = await getTransactions(xpub, startAt);
  const newOperations = mapTxsToOperations(newTransactions);
  const operations = mergeOps(oldOperations, newOperations);

  const utxos = []; // TODO

  return {
    id,
    balance,
    spendableBalance,
    operations,
    operationsCount: operations.length,
    blockHeight,
    bitcoinResources: {
      utxos,
    },
  };
};

const postSync = (initial: Account, synced: Account) => {
  // TODO

  // libcore-based implementation
  /*
  if (isSatStackEnabled() && account.currency.id === "bitcoin") {
    const inferred = inferDescriptorFromAccount(account);
    if (inferred) {
      const exists = await checkDescriptorExists(inferred.internal);
      if (!exists) {
        throw new SatStackDescriptorNotImported();
      }
    }
  }

  log("bitcoin/post-buildAccount", "bitcoinResources");
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const count = await bitcoinLikeAccount.getUTXOCount();
  const objects = await bitcoinLikeAccount.getUTXO(0, count);
  const utxos = await promiseAllBatched(6, objects, parseBitcoinUTXO);
  const perCoin = perCoinLogic[account.currency.id];
  let bitcoinResources: BitcoinResources = {
    ...account.bitcoinResources,
    utxos,
  };
  if (perCoin) {
    if (perCoin.postBuildBitcoinResources) {
      bitcoinResources = perCoin.postBuildBitcoinResources(
        account,
        bitcoinResources
      );
    }
    const { syncReplaceAddress } = perCoin;
    if (syncReplaceAddress) {
      account.freshAddress = syncReplaceAddress(account, account.freshAddress);
      account.freshAddresses = account.freshAddresses.map((a) => ({
        ...a,
        address: syncReplaceAddress(account, a.address),
      }));
      bitcoinResources.utxos = bitcoinResources.utxos.map((u) => ({
        ...u,
        address: u.address && syncReplaceAddress(account, u.address),
      }));
    }
  }
  account.bitcoinResources = bitcoinResources;
  log("bitcoin/post-buildAccount", "bitcoinResources DONE");
  return account;
  */

  return synced;
};

export const scanAccounts = makeScanAccounts(getAccountShape);

export const sync = makeSync(getAccountShape, postSync);
