// @flow
import invariant from "invariant";
import type { Account, Operation, Unit } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

function formatAccountSpecifics(account: Account): string {
  const { elrondResources } = account;
  invariant(elrondResources, "elrond account expected");
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  let str = " ";

  if (account.spendableBalance) {
    str +=
      formatCurrencyUnit(unit, account.spendableBalance, formatConfig) +
      " spendable. ";
  } else {
    str += " 0 spendable.";
  }

  if (elrondResources.nonce) {
    str += "\nonce : " + elrondResources.nonce;
  }

  return str;
}

function formatOperationSpecifics(op: Operation, unit: ?Unit): string {
  let str = " ";

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  return str;
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
