// @flow

import { Observable, from, of } from "rxjs";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";
import { TezosToolkit } from "@taquito/taquito";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Transaction } from "./types";
import type { Operation, Account, SignOperationEvent } from "../../types";
import { withDevice } from "../../hw/deviceAccess";
import { getEnv } from "../../env";

export const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account,
  deviceId: *,
  transaction: Transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      let cancelled;

      async function main() {
        const { freshAddressPath, freshAddress } = account;
        const { amount, recipient } = transaction;

        const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));

        const ledgerSigner = new LedgerSigner(
          transport,
          freshAddressPath,
          false,
          DerivationType.ED25519
        );
        tezos.setProvider({ signer: ledgerSigner });

        /*
        const out = await tezos.estimate.transfer({
          to: transaction.recipient,
          amount: transaction.amount,
        });

        console.log(out);
        */

        console.log("about to sign bro");

        await tezos.contract.transfer({
          to: transaction.recipient,
          amount: transaction.amount,
        });

        o.next({ type: "device-signature-requested" });

        o.next({ type: "device-signature-granted" });

        // Second, we re-set some tx fields from the device signature

        // Generate the signature ready to be broadcasted
        const signature = ``; // FIXME

        const to = recipient; // FIXME
        const value = amount; // FIXME

        // build optimistic operation
        const txHash = ""; // resolved at broadcast time
        const senders = [freshAddress];
        const recipients = [to];
        const fee = BigNumber(0); // FIXME
        const transactionSequenceNumber = 0; // FIXME
        const accountId = account.id;

        // currently, all mode are always at least one OUT tx on ETH parent
        const operation: $Exact<Operation> = {
          id: `${accountId}-${txHash}-OUT`,
          hash: txHash,
          transactionSequenceNumber,
          type: "OUT",
          value: BigNumber(value),
          fee,
          blockHash: null,
          blockHeight: null,
          senders,
          recipients,
          accountId,
          date: new Date(),
          extra: {},
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            expirationDate: null,
          },
        });
      }

      main().then(
        () => o.complete(),
        (e) => (console.error("OOPSY", e), o.error(e))
      );

      return () => {
        cancelled = true;
      };
    })
  );
