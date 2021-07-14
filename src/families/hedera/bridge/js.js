// @flow
import type { AccountBridge, CurrencyBridge } from '../../../types';
import type { Transaction } from '../types';
import { makeAccountBridgeReceive } from '../../../bridge/jsHelpers';

// Somehow can't resolve? Maybe because it doesn't exist?
import broadcast from '../js-broadcast';
import estimateMaxSpendable from '../js-estimateMaxSpendable';
import getTransactionStatus from '../js-getTransactionStatus';
import signOperation from '../js-signOperation';
import { sync, scanAccounts } from '../js-synchronisation';
import {
  createTransaction,
  updateTransaction,
  prepareTransaction
} from '../js-transaction';
import { getPreloadStrategy, preload, hydrate } from '../preload';

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast
};

export default { currencyBridge, accountBridge };
