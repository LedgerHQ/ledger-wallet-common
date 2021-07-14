// @flow
import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";

import type { HederaPreloadData } from "./types";
import { getPreloadedData } from "./api";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: HederaPreloadData = {
  somePreloadedData: {}
};

function fromHydratePreloadData(data: mixed): HederaPreloadData {
  let foo = null;

  if (typeof data === "object" && data) {
    if (typeof data.somePreloadedData === "object" && data.somePreloadedData) {
      foo = data.somePreloadedData.foo || "bar";
    }
  }

  return {
    somePreloadedData: { foo }
  };
}

const updates = new Subject<HederaPreloadData>();

export function getCurrentHederaPreloadData(): HederaPreloadData {
  return currentPreloadedData;
}

export function setHederaPreloadData(data: HederaPreloadData) {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}

export function getHederaPreloadDataUpdates(): Observable<HederaPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE
});

export const preload = async (): Promise<HederaPreloadData> => {
  log("hedera/preload", "preloading hedera data...");

  const somePreloadedData = await getPreloadedData();

  return { somePreloadedData };
};

export const hydrate = (data: mixed) => {
  const hydrated = fromHydratePreloadData(data);

  log("hedera/preload", `hydrated foo with ${hydrated.somePreloadedData.foo}`);

  setHederaPreloadData(hydrated);
};
