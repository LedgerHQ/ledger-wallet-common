/* eslint-disable global-require */
import { from, of, concat, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";
export default {
  args: [],
  job: async (): Promise<Observable<string>> =>
    concat(
      of("ledger-live cli: " + (await import("../../package.json")).version),
      of(
        "@ledgerhq/live-common: " +
          (await import("@ledgerhq/live-common/package.json")).version
      ),
      of(
        "@ledgerhq/ledger-core: " +
          (await import("@ledgerhq/ledger-core/package.json")).version
      ),
      from(withLibcore((core) => core.LedgerCore.getStringVersion())).pipe(
        map((v) => "libcore: " + v)
      )
    ),
};
