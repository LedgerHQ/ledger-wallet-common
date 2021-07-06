// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";

const acceptTransaction: DeviceAction<Transaction, *> = deviceActionFlow({
  steps: [
    {
      title: "Review",
      button: "Rr",
    },
    {
      title: "Confirm",
      button: "Rr",
      expectedValue: () => {
        return "Transaction";
      },
    },
    {
      title: "Amount",
      button: "Rr",
      expectedValue: ({ account, transaction }) => {
        const amount = transaction.amount;
        return formatCurrencyUnit(account.unit, amount, {
          disableRounding: true,
          joinFragmentsSeparator: " ",
        }).replace(/\s/g, " ");
      },
    },
    {
      title: "Fee",
      button: "Rr",
      expectedValue: ({ account, status }) => {
        const amount = status.estimatedFees;
        return formatCurrencyUnit(account.currency.units[0], amount, {
          disableRounding: true,
          joinFragmentsSeparator: " ",
        }).replace(/\s/g, " ");
      },
    },
    {
      title: "Source",
      button: "Rr",
      expectedValue: ({ account }) => account.freshAddress,
    },
    {
      title: "Destination",
      button: "Rr",
      expectedValue: ({ transaction }) => transaction.recipient,
    },
    {
      title: "Storage Limit",
      button: "Rr",
    },
    {
      title: "Reject",
      button: "Rr",
      expectedValue: () => "257",
    },
    {
      title: "Accept",
      button: "LRlr",
    },
  ],
});

export default { acceptTransaction };
