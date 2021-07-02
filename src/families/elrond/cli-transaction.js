// @flow
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction, AccountLike } from "../../types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
];

function inferTransactions(
  transactions: Array<{ account: AccountLike, transaction: Transaction }>,
  opts: Object
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "elrond", "elrond family");

    if (account.type === "Account") {
      invariant(account.elrondResources, "unactivated account");
    }

    return {
      ...transaction,
      family: "elrond",
      mode: opts.mode || "send",
    };
  });
}

export default {
  options,
  inferTransactions,
};
