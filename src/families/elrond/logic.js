// @flow
import type { Account } from "../../types";

import { getNetworkConfig } from "./api";

export const compareVersions = (versionA: string, versionB: string): number => {
  let i, diff;
  const regExStrip0 = /(\.0+)+$/;
  const segmentsA = versionA.replace(regExStrip0, "").split(".");
  const segmentsB = versionB.replace(regExStrip0, "").split(".");
  const minVersionLength = Math.min(segmentsA.length, segmentsB.length);

  for (i = 0; i < minVersionLength; i++) {
    diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
    if (diff == 0) {
      continue;
    }

    if (diff < 0) {
      return -1;
    }

    return 1;
  }

  return segmentsA.length - segmentsB.length;
};

/**
 * Returns true if address is a valid bech32
 *
 * @param {string} address
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;

  if (!address.startsWith("erd1")) return false;

  if (address.length !== 62) return false;

  return true;
};

/**
 * Returns nonce for an account
 *
 * @param {Account} a
 */
export const getNonce = (a: Account): number => {
  const lastPendingOp = a.pendingOperations[0];

  const nonce = Math.max(
    a.elrondResources?.nonce || 0,
    lastPendingOp && typeof lastPendingOp.transactionSequenceNumber === "number"
      ? lastPendingOp.transactionSequenceNumber + 1
      : 0
  );

  return nonce;
};

export const getNetworkConfigs = async () => {
  return await getNetworkConfig();
};
