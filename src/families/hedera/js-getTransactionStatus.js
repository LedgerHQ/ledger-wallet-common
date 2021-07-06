// @flow
import { BigNumber } from 'bignumber.js';
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded
} from '@ledgerhq/errors';
import type { Account, TransactionStatus } from '../../types';
import type { Transaction } from './types';

import { isValidAddress, specificCheck } from './logic';
import { HederaSpecificError } from './errors';

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors = {};
  const warnings = {};
  const useAllAmount = !!t.useAllAmount;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || BigNumber(0);

  const totalSpent = useAllAmount
    ? a.balance
    : BigNumber(t.amount).plus(estimatedFees);

  const amount = useAllAmount
    ? a.balance.minus(estimatedFees)
    : BigNumber(t.amount);

  if (totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  // If Hedera needs any specific requirement on amount for instance
  if (specificCheck(t.amount)) {
    errors.amount = new HederaSpecificError();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent
  });
};

export default getTransactionStatus;
