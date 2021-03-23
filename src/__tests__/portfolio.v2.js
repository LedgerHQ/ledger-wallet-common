// @flow
import "./test-helpers/staticTime";
import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
} from "@ledgerhq/cryptoassets";
import { initialState, loadCountervalues } from "../countervalues/logic";
import {
  getPortfolioCount,
  getBalanceHistory,
  getBalanceHistoryWithCountervalue,
  getPortfolio,
} from "../portfolio/v2";
import { getPortfolioRangeConfig, getDates } from "../portfolio/v2/range";
import type { PortfolioRange } from "../portfolio/v2/types";
import type { AccountLike } from "../types";
import { setEnv } from "../env";
import { genAccount } from "../mock/account";
import { getAccountCurrency } from "../account";

setEnv("MOCK", "1");

describe("Portfolio", () => {
  const rangeCount: [PortfolioRange, number][] = [
    ["all", 52],
    ["year", 52],
    ["month", 30],
    ["week", 168],
    ["day", 24],
  ];

  describe("getPortfolioCount", () => {
    const accounts: AccountLike[] = Array.from({ length: 100 }).map((_, j) =>
      genAccount("portfolio_" + j)
    );
    describe("default count", () => {
      rangeCount.forEach(([range, count]) => {
        it(`shoud return default count (${range})`, () => {
          const res = getPortfolioCount(accounts, range);
          expect(res).toBe(count);
        });
      });
    });

    describe("all time", () => {
      const range = "all";
      it("should return calculated count", () => {
        const accounts: AccountLike[] = [
          {
            ...genAccount("bitcoin_1"),
            creationDate: new Date("2008-10-31"), // Bitcoin paper issued
          },
        ];
        const res = getPortfolioCount(accounts, range);
        expect(res).toBe(489);
      });

      it("should return at least a year", () => {
        const res = getPortfolioCount(accounts, range);
        const count = getPortfolioRangeConfig("year").count;
        expect(res).toBe(count);
      });
    });
  });

  describe("getBalanceHistory", () => {
    const account = genAccount("account_1");

    describe("snapshots", () => {
      rangeCount.forEach(([range, count]) => {
        it("should match its prev snapshot", () => {
          const history = getBalanceHistory(account, range, count);
          expect(history).toMatchSnapshot();
        });
      });
    });

    it("should return history with length specified with count arg", () => {
      const [[range, count]] = rangeCount;
      const history = getBalanceHistory(account, range, count);
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(count);
    });

    it("should have dates matche getDates", () => {
      const [, [range, count]] = rangeCount;
      const history = getBalanceHistory(account, range, count);
      const dates = getDates(range, count);
      expect(history.map((p) => p.date)).toMatchObject(dates);
    });
  });

  describe("getBalanceHistoryWithCountervalue", () => {
    const account = genAccountBitcoin();
    const [range, count] = rangeCount[0];

    it("should return false as coutnervalueAvailable when latest countervalue does NOT exists", async () => {
      const { to } = await loadCV(account);
      const state = { ...initialState, data: {} };
      const cv = getBalanceHistoryWithCountervalue(
        account,
        range,
        count,
        state,
        to
      );
      expect(cv.countervalueAvailable).toBe(false);
    });

    it("should return same value as history", async () => {
      const { state, to } = await loadCV(account);
      const cv = getBalanceHistoryWithCountervalue(
        account,
        range,
        count,
        state,
        to
      );
      const history = getBalanceHistory(account, range, count);
      expect(cv.countervalueAvailable).toBe(true);
      expect(
        cv.history.map((p) => ({ date: p.date, value: p.value }))
      ).toMatchObject(history);
    });

    test("snapshot", async () => {
      const { state, to } = await loadCV(account);
      const cv = getBalanceHistoryWithCountervalue(
        account,
        range,
        count,
        state,
        to
      );
      expect(cv).toMatchSnapshot();
    });
  });

  describe("getPortfolio", () => {
    it("should have history identical to that account history", async () => {
      const account = genAccountBitcoin();
      const range = "week";
      const { state, to } = await loadCV(account);
      const portfolio = getPortfolio([account], range, state, to);
      expect(portfolio.availableAccounts).toMatchObject([account]);
      expect(portfolio.balanceAvailable).toBe(true);
      expect(portfolio.balanceHistory).toMatchSnapshot();
    });

    it("should have proper countervalues", () => {});
  });

  describe("getCurrencyPortfolio", () => {});

  describe("getAssetsDistribution", () => {});
});

function genAccountBitcoin(id: string = "bitcoin_1") {
  return genAccount(id, { currency: getCryptoCurrencyById("bitcoin") });
}

async function loadCV(account: AccountLike) {
  const from = getAccountCurrency(account);
  const to = getFiatCurrencyByTicker("USD");
  const state = await loadCountervalues(initialState, {
    trackingPairs: [{ from, to }],
    autofillGaps: true,
  });
  return { state, from, to };
}
