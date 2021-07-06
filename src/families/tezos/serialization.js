// @flow
import type { TezosResources, TezosResourcesRaw } from "./types";

export function toTezosResourcesRaw(r: TezosResources): TezosResourcesRaw {
  const { revealed } = r;
  return { revealed };
}

export function fromTezosResourcesRaw(r: TezosResourcesRaw): TezosResources {
  const { revealed } = r;
  return { revealed };
}
