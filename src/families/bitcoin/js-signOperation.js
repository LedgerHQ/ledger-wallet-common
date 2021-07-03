// @flow

import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";

import Btc from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import { FeeNotLoaded } from "@ledgerhq/errors";

import type { Account, Operation, SignOperationEvent } from "./../../types";
import { isSegwitDerivationMode } from "./../../derivation";
import { encodeOperationId } from "./../../operation";
import { open, close } from "./../../hw";

import type { BitcoinOutput, Transaction } from "./types";
import { isChangeOutput, perCoinLogic } from "./logic";
import { getNetworkParameters } from "./networks";

const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account,
  deviceId: *,
  transaction: Transaction,
}): Observable<SignOperationEvent> =>
  Observable.create((o) => {
    async function main() {
      const { currency } = account;
      const transport = await open(deviceId);

      // TODO Use this code adapted from libcore impl, or re-write it all if needed

      try {
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        log("hw", `signTransaction ${currency.id} for account ${account.id}`);

        const perCoin = perCoinLogic[currency.id];

        const version = 1; // FIXME get correct version (1st byte of signature?)
        const networkParams = getNetworkParameters(currency.id, version);

        const sigHashTypeHex = await networkParams.sigHash;
        const sigHashType = parseInt(sigHashTypeHex, 16);
        if (isNaN(sigHashType)) {
          throw new Error("sigHashType should not be NaN");
        }

        const hwApp = new Btc(transport);
        let additionals = [currency.id];
        if (account.derivationMode === "native_segwit") {
          additionals.push("bech32");
        }
        if (perCoin?.getAdditionals) {
          additionals = additionals.concat(
            perCoin.getAdditionals({ transaction })
          );
        }

        const expiryHeight = perCoin?.hasExpiryHeight
          ? Buffer.from([0x00, 0x00, 0x00, 0x00])
          : undefined;

        // TODO Retreive and manage inputs
        const inputs = [];

        /*
        const hasTimestamp = networkParams.usesTimestampedTransaction;
        const hasExtraData = perCoin?.hasExtraData || false;
        const rawInputs: CoreBitcoinLikeInput[] = await coreTransaction.getInputs();
        const inputs = await promiseAllBatched(
          5,
          rawInputs,
          async (input, i) => {
            const hexPreviousTransaction = await input.getPreviousTransaction();
            //log("libcore", "splitTransaction " + String(hexPreviousTransaction));

            // v1 of XST txs have timestamp but not v2
            const inputHasTimestamp =
              (currency.id === "stealthcoin" &&
                hexPreviousTransaction.slice(0, 2) === "01") ||
              hasTimestamp;

            log("hw", `splitTransaction`, {
              hexPreviousTransaction,
              supportsSegwit: currency.supportsSegwit,
              inputHasTimestamp,
              hasExtraData,
              additionals,
            });

            const previousTransaction = hwApp.splitTransaction(
              hexPreviousTransaction,
              currency.supportsSegwit,
              inputHasTimestamp,
              hasExtraData,
              additionals
            );

            const outputIndex = await input.getPreviousOutputIndex();

            // NB libcore's sequence is not used because int32 limit issue
            const sequence = transaction.rbf ? 0 : 0xffffffff;

            //log("libcore", "inputs[" + i + "]", { previousTransaction: JSON.stringify(previousTransaction), outputIndex, sequence, });

            return [
              previousTransaction,
              outputIndex,
              undefined, // (legacy) we don't use that
              sequence,
            ];
          }
        );
        */

        // TODO
        const associatedKeysets = [];
        /*
        const associatedKeysets = await promiseAllBatched(
          5,
          rawInputs,
          async (input) => {
            const derivationPaths = await input.getDerivationPath();
            const [first] = derivationPaths;
            if (!first) throw new Error("unexpected empty derivationPaths");
            const r = await first.toString();
            return r;
          }
        );
        */

        // FIXME Getting utxos from Account.bitcoinResources - does it work?
        //const outputs: CoreBitcoinLikeOutput[] = await coreTransaction.getOutputs();
        const outputs: BitcoinOutput[] = account.bitcoinResources?.utxos || []; // TODO Throw an error if !account.bitcoinResources

        let changePath;
        for (const output of outputs) {
          //const output = await parseBitcoinOutput(o);
          if (isChangeOutput(output)) {
            changePath = output.path || undefined;
          }
        }

        // TODO Serialize utxos
        //const outputScriptHex = await coreTransaction.serializeOutputs();
        const outputScriptHex = "";

        // FIXME Transaction type doesn't contain timestamp, add it?
        const initialTimestamp = undefined;
        /*
        const initialTimestamp = hasTimestamp
          ? transaction.timestamp
          : undefined;
        */

        // FIXME (legacy)
        // should be `transaction.getLockTime()` as soon as lock time is
        // handled by libcore (actually: it always returns a default value
        // and that caused issue with zcash (see #904))
        let lockTime;

        // (legacy) Set lockTime for Komodo to enable reward claiming on UTXOs created by
        // Ledger Live. We should only set this if the currency is Komodo and
        // lockTime isn't already defined.
        if (currency.id === "komodo" && lockTime === undefined) {
          const unixtime = Math.floor(Date.now() / 1000);
          lockTime = unixtime - 777;
        }

        // FIXME Taking derivationMode from account here, does it work?
        const segwit = isSegwitDerivationMode(account.derivationMode);

        log("hw", `createPaymentTransactionNew`, {
          associatedKeysets,
          changePath,
          outputScriptHex,
          lockTime,
          sigHashType,
          segwit,
          initialTimestamp,
          additionals,
          expiryHeight: expiryHeight && expiryHeight.toString("hex"),
        });

        const signature = await hwApp.createPaymentTransactionNew({
          inputs,
          associatedKeysets,
          changePath,
          outputScriptHex,
          lockTime,
          sigHashType,
          segwit,
          initialTimestamp,
          additionals,
          expiryHeight,
          onDeviceSignatureGranted: () =>
            o.next({ type: "device-signature-granted" }),
          onDeviceSignatureRequested: () =>
            o.next({ type: "device-signature-requested" }),
          onDeviceStreaming: ({ progress, index, total }) =>
            o.next({ type: "device-streaming", progress, index, total }),
        });

        // TODO Get from inputs the addresses of senders
        const senders = [];
        /*
        const sendersInput = await coreTransaction.getInputs(); // FIXME What's the difference with 'rawInputs 'above??
        const senders = (
          await promiseAllBatched(5, sendersInput, (senderInput) =>
            senderInput.getAddress()
          )
        ).filter(Boolean);
        */

        // TODO Get from outputs the addresses of recipients
        const recipients = [];
        /*
        const recipientsOutput = await coreTransaction.getOutputs(); // FIXME What's the difference with 'outputs' above??
        const recipients = (
          await promiseAllBatched(5, recipientsOutput, (recipientOutput) =>
            recipientOutput.getAddress()
          )
        ).filter(Boolean);
        */

        const fee = transaction.fees || BigNumber(0);

        // Build the optimistic operation
        const operation: $Exact<Operation> = {
          id: encodeOperationId(account.id, "", "OUT"),
          hash: "", // Will be resolved in broadcast()
          type: "OUT",
          value: BigNumber(transaction.amount).plus(fee),
          fee,
          blockHash: null,
          blockHeight: null,
          senders,
          recipients,
          accountId: account.id,
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
      } finally {
        close(transport, deviceId);
      }
    }
    main().then(
      () => o.complete(),
      (e) => o.error(e)
    );
  });

export default signOperation;
