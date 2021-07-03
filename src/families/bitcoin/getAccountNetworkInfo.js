// @flow
import { BigNumber } from "bignumber.js";

import type { Account } from "../../types";

import { getFees } from "./api/ledgerApi";

const speeds = ["fast", "medium", "slow"];

export function avoidDups(nums: Array<BigNumber>): Array<BigNumber> {
  nums = nums.slice(0);
  for (let i = nums.length - 2; i >= 0; i--) {
    if (nums[i + 1].gte(nums[i])) {
      nums[i] = nums[i + 1].plus(1);
    }
  }
  return nums;
}

export async function getAccountNetworkInfo(
  account: Account
): Promise<NetworkInfo> {
  const bigNumbers = await getFees(account);

  const normalized = avoidDups(
    bigNumbers.map((bn) => bn.div(1000).integerValue(BigNumber.ROUND_CEIL))
  );
  const feeItems = {
    items: normalized.map((feePerByte, i) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    defaultFeePerByte:
      normalized[Math.floor(normalized.length / 2)] || BigNumber(0),
  };
  return {
    family: "bitcoin",
    feeItems,
  };
}
