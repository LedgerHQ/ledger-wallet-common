// @flow
import { BigNumber } from "bignumber.js";
import sample from "lodash/sample";
import invariant from "invariant";
import expect from "expect";
import sortBy from "lodash/sortBy";
import sampleSize from "lodash/sampleSize";
import get from "lodash/get";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { getUnfreezeData, getNextRewardDate } from "./react";

const currency = getCryptoCurrencyById("tron");
const minimalAmount = parseCurrencyUnit(currency.units[0], "1");
const maxAccount = 10;

const getDecimalPart = (value: BigNumber, magnitude: number) =>
  value.minus(value.modulo(10 ** magnitude));

const tron: AppSpec<Transaction> = {
  name: "Tron",
  currency,
  appQuery: {
    model: "nanoS",
    appName: "Tron",
  },
  testTimeout: 2 * 60 * 1000,
  mutations: [
    {
      name: "move 50% to another account",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient }, { amount }],
        };
      },
      test: ({ accountBeforeTransaction, operation, account }) => {
        expect(account.spendableBalance.toString()).toBe(
          accountBeforeTransaction.spendableBalance
            .minus(operation.value)
            .toString()
        );
      },
    },
    {
      name: "send max to another account",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient }, { useAllAmount: true }],
        };
      },
      test: ({ account }) => {
        expect(account.spendableBalance.toString()).toBe("0");
      },
    },
    {
      name: "freeze 25% to bandwidth | energy",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const amount = getDecimalPart(
          maxSpendable.div(4),
          currency.units[0].magnitude
        ).integerValue(BigNumber.ROUND_CEIL);
        const energy = get(account, `tronResources.energy`, BigNumber(0));
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            { mode: "freeze" },
            { resource: energy.eq(0) ? "ENERGY" : "BANDWIDTH" },
            { amount },
          ],
        };
      },
      test: ({ account, accountBeforeTransaction, transaction }) => {
        const resourceType = (transaction.resource || "").toLocaleLowerCase();

        const resourceBeforeTransaction = get(
          accountBeforeTransaction,
          `tronResources.frozen.${resourceType}.amount`,
          BigNumber(0)
        );

        const expectedAmount = BigNumber(transaction.amount)
          .times(10e6)
          .plus(resourceBeforeTransaction);

        const currentRessourceAmount = get(
          account,
          `tronResources.frozen.${resourceType}.amount`,
          BigNumber(0)
        );

        expect(expectedAmount.toString()).toBe(
          currentRessourceAmount.toString()
        );

        const TPBefore = get(
          accountBeforeTransaction,
          "tronResources.tronPower",
          BigNumber(0)
        );
        const currentTP = BigNumber(get(account, "tronResources.tronPower", 0));
        const expectedTP = transaction.amount.plus(TPBefore);
        expect(expectedTP.toString()).toBe(currentTP.toString());
      },
    },
    {
      name: "unfreeze bandwith / energy",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const TP = BigNumber(get(account, "tronResources.tronPower", "0"));
        invariant(TP.gt(0), "no frozen assets");
        const { canUnfreezeBandwidth, canUnfreezeEnergy } = getUnfreezeData(
          account
        );
        invariant(
          canUnfreezeBandwidth || canUnfreezeEnergy,
          "freeze period not expired yet"
        );
        const resourceToUnfreeze = canUnfreezeBandwidth
          ? "BANDWIDTH"
          : "ENERGY";

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "unfreeze" }, { resource: resourceToUnfreeze }],
        };
      },
      test: ({ account, accountBeforeTransaction, transaction }) => {
        const TxResource = (transaction.resource || "").toLocaleLowerCase();

        const currentFrozen = get(
          account,
          `tronResources.frozen.${TxResource}`,
          undefined
        );

        expect(currentFrozen).toBeUndefined();

        const TPBeforeTx = BigNumber(
          get(accountBeforeTransaction, "tronResources.tronPower", 0)
        );
        const currentTP = BigNumber(get(account, "tronResources.tronPower", 0));
        const expectedTronPower = TPBeforeTx.minus(transaction.amount);
        expect(currentTP.toString()).toBe(expectedTronPower.toString());
      },
    },
    {
      name: "submit vote",
      maxRun: 1,
      transaction: ({ account, bridge, preloadedData }) => {
        const TP = BigNumber(get(account, "tronResources.tronPower", "0"));
        invariant(TP.gt(0), "no tron power to vote");

        const currentTPVoted = get(account, "tronResources.votes", []).reduce(
          (acc, curr) => acc.plus(BigNumber(get(curr, "voteCount", 0))),
          BigNumber(0)
        );

        invariant(TP.gt(currentTPVoted), "you have no tron power left");
        const { superRepresentatives } = preloadedData;
        invariant(
          superRepresentatives && superRepresentatives.length,
          "there are no super representatives to vote for, or the list has not been loaded yet"
        );

        const count = 1 + Math.floor(5 * Math.random());
        const candidates = sampleSize(superRepresentatives.slice(0, 40), count);
        let remaining = TP;
        const votes = candidates
          .map((c) => {
            if (!remaining.gt(0)) return null;
            const voteCount = remaining.eq(1)
              ? remaining.integerValue().toNumber()
              : remaining.times(Math.random()).integerValue().toNumber();
            if (voteCount === 0) return null;
            remaining = remaining.minus(voteCount);
            return {
              address: c.address,
              voteCount,
            };
          })
          .filter(Boolean);

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "vote" }, { votes }],
        };
      },
      test: ({ account, transaction }) => {
        const votes = sortBy(transaction.votes, ["address"]);
        const currentVotes = sortBy(get(account, "tronResources.votes", []), [
          "address",
        ]);
        expect(currentVotes).toEqual(votes);
      },
    },
    {
      name: "move some TRC10",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const trc10Account = sample(
          (account.subAccounts || []).filter(
            (a) => a.type === "TokenAccount" && a.token.tokenType === "trc10"
          )
        );
        invariant(trc10Account, "no trc10 account");
        invariant(trc10Account.gt(0), "trc10 account has no balance");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            { recipient, subAccountId: trc10Account.id },
            Math.random() < 0.5
              ? { useAllAmount: true }
              : {
                  amount: trc10Account.balance
                    .times(Math.random())
                    .integerValue(),
                },
          ],
        };
      },
      test: ({ accountBeforeTransaction, account, transaction }) => {
        invariant(accountBeforeTransaction.subAccounts, "sub accounts before");
        const trc10accountBefore = accountBeforeTransaction.subAccounts.find(
          (s) => s.id === transaction.subAccountId
        );
        invariant(trc10accountBefore, "trc10 acc was here before");
        invariant(account.subAccounts, "sub accounts");
        const trc10account = account.subAccounts.find(
          (s) => s.id === transaction.subAccountId
        );
        invariant(trc10account, "trc10 acc is still here");
        if (transaction.useAllAmount) {
          expect(trc10account.balance.toString()).toBe("0");
        } else {
          expect(trc10account.balance.toString()).toBe(
            trc10accountBefore.balance.minus(transaction.amount).toString()
          );
        }
      },
    },
    {
      name: "move some TRC20",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const balance = account.spendableBalance;
        const energy = get(account, "tronResources.energy", BigNumber(0));
        invariant(energy.gt(0) || balance.gt(0), "trx and energy too low");
        const trc20Account = sample(
          (account.subAccounts || []).filter(
            (a) => a.type === "TokenAccount" && a.token.tokenType === "trc20"
          )
        );
        invariant(trc20Account, "no trc20 account");
        invariant(trc20Account.gt(0), "trc20 account has no balance");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            { recipient, subAccountId: trc20Account.id },
            Math.random() < 0.5
              ? { useAllAmount: true }
              : {
                  amount: trc20Account.balance
                    .times(Math.random())
                    .integerValue(),
                },
          ],
        };
      },
      test: ({ accountBeforeTransaction, account, transaction }) => {
        invariant(accountBeforeTransaction.subAccounts, "sub accounts before");
        const trc20accountBefore = accountBeforeTransaction.subAccounts.find(
          (s) => s.id === transaction.subAccountId
        );
        invariant(trc20accountBefore, "trc20 acc was here before");
        invariant(account.subAccounts, "sub accounts");
        const trc20account = account.subAccounts.find(
          (s) => s.id === transaction.subAccountId
        );
        invariant(trc20account, "trc20 acc is still here");
        if (transaction.useAllAmount) {
          expect(trc20account.balance.toString()).toBe("0");
        } else {
          expect(trc20account.balance.toString()).toBe(
            trc20accountBefore.balance.minus(transaction.amount).toString()
          );
        }

        if (
          get(trc20accountBefore, "tronResources.energy", BigNumber(0)).eq(0)
        ) {
          expect(account.balance.lt(accountBeforeTransaction.balance)).toBe(
            true
          );
        } else {
          expect(
            get(account, "tronResources.energy", BigNumber(0)).lt(
              get(
                accountBeforeTransaction,
                "tronResources.energy",
                BigNumber(0)
              )
            )
          ).toBe(true);
          expect(account.balance.eq(accountBeforeTransaction.balance)).toBe(
            true
          );
        }
      },
    },
    {
      name: "claim rewards",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const nextRewardDate = getNextRewardDate(account);
        const today = Date.now();

        const unwithdrawnReward = BigNumber(
          get(account, "tronResources.unwithdrawnReward", "0")
        );

        invariant(unwithdrawnReward.gt(0), "no rewards to claim");
        invariant(
          nextRewardDate && nextRewardDate <= today,
          "you can't claim twice in less than 24 hours"
        );

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "claimReward" }],
        };
      },
      test: ({ account }) => {
        const rewards = BigNumber(
          get(account, "tronResources.unwithdrawnReward", "0")
        );

        const nextRewardDate = getNextRewardDate(account);
        expect(rewards.eq(0)).toBe(true);
        expect(nextRewardDate && nextRewardDate > Date.now()).toBe(true);
      },
    },
  ],
};

export default { tron };
