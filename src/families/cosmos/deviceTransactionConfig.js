// @flow

import type { AccountLike, Account, TransactionStatus } from "../../types";
import type { Transaction } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { getMainAccount } from "../../account";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export type ExtraDeviceTransactionField =
  | { type: "cosmos.memo", label: string }
  | { type: "cosmos.delegateValidators", label: string }
  | { type: "cosmos.validatorName", label: string }
  | { type: "cosmos.validatorAmount", label: string }
  | { type: "cosmos.sourceValidatorName", label: string };

const postCommon = (account, memo, estimatedFees, gas) => {
  const fields = [];

  if (memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: memo,
    });
  }

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "text",
      label: "Fee",
      value: formatCurrencyUnit(getAccountUnit(account), estimatedFees, {
        showCode: true,
      }),
    });
  }

  if (gas) {
    fields.push({
      type: "text",
      label: "Gas",
      value: gas.toString(),
    });
  }

  return fields;
};

const getSendFields = (transaction, status, account, source) => {
  const { amount } = transaction;
  const fields = [];

  fields.push({
    type: "text",
    label: "Type",
    value: "Send",
  });

  if (amount) {
    fields.push({
      type: "text",
      label: "Amount",
      value: formatCurrencyUnit(getAccountUnit(account), amount, {
        showCode: true,
      }),
    });
  }

  fields.push({
    type: "text",
    label: "From",
    value: source,
  });

  return fields;
};

function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
  status,
}: {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  status: TransactionStatus,
}): Array<DeviceTransactionField> {
  const { mode, memo, gas, validators, cosmosSourceValidator } = transaction;
  const { estimatedFees } = status;
  const mainAccount = getMainAccount(account, parentAccount);
  const source = mainAccount.freshAddress;

  let fields = [];

  switch (mode) {
    case "send":
      fields = getSendFields(transaction, status, account, source);
      break;

    case "delegate":
      fields.push({
        type: "text",
        label: "Type",
        value: "Delegate",
      });

      fields.push({
        type: "cosmos.delegateValidators",
        label: "Validators",
      });
      break;

    case "undelegate":
      fields.push({
        type: "text",
        label: "Type",
        value: "Undelegate",
      });
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(
          getAccountUnit(account),
          validators[0].amount,
          {
            showCode: true,
          }
        ),
      });
      fields.push({
        type: "text",
        label: "Validator",
        value: validators[0].address,
      });
      break;

    case "redelegate":
      fields.push({
        type: "text",
        label: "Type",
        value: "Redelegate",
      });
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(
          getAccountUnit(account),
          validators[0].amount,
          {
            showCode: true,
          }
        ),
      });
      fields.push({
        type: "text",
        label: "Validator Dest",
        value: validators[0].address,
      });
      fields.push({
        type: "text",
        label: "Validator Source",
        value: cosmosSourceValidator,
      });
      break;
    case "claimReward":
      fields.push({
        type: "text",
        label: "Type",
        value: "Withdraw Reward",
      });
      fields.push({
        type: "text",
        label: "Validator",
        value: validators[0].address,
      });
      break;
    case "claimRewardCompound":
      fields.push({
        type: "text",
        label: "Type",
        value: "Withdraw Reward",
      });
      fields.push({
        type: "text",
        label: "Validator",
        value: validators[0].address,
      });

      fields.push({
        type: "text",
        label: "Type",
        value: "Delegate",
      });

      fields.push({
        type: "cosmos.delegateValidators",
        label: "Validators",
      });
      break;
    default:
      break;
  }

  fields = [...fields, ...postCommon(account, memo, estimatedFees, gas)];

  return fields;
}

export default getDeviceTransactionConfig;
