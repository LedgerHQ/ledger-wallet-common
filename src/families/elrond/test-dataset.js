// @flow
import type { DatasetTest } from "../../types";
import type { Transaction } from "./types";

type TestTransaction = {
  name: string,
  transaction: Transaction,
  expectedStatus: {
    amount: BigNumber,
    errors: {},
    warnings: {},
  },
};

export default dataset = {
  implementations: ["js"],
  currencies: {
    elrond: {
      scanAccounts: [
        {
          name: "elrond seed 1",
          apdus: `
              => ed030000080000000000000000
              <= 3e65726431726e71376d386b6472707966616e793466776571747964736b34706778306c3664746c367476636164357765736167727578747336326539726b9000
              => ed030000080000000000000000
              <= 3e65726431726e71376d386b6472707966616e793466776571747964736b34706778306c3664746c367476636164357765736167727578747336326539726b9000
              `,
        },
      ],
      accounts: [
        {
          raw: {
            id: `js:2:elrond:erd1rnq7m8kdrpyfany4fweqtydsk4pgx0l6dtl6tvcad5wesagruxts62e9rk:`,
            seedIdentifier:
              "erd1rnq7m8kdrpyfany4fweqtydsk4pgx0l6dtl6tvcad5wesagruxts62e9rk",
            name: "Elrond 1",
            derivationMode: "",
            index: 0,
            freshAddress:
              "erd1rnq7m8kdrpyfany4fweqtydsk4pgx0l6dtl6tvcad5wesagruxts62e9rk",
            freshAddressPath: "44'/508'/0'/0/0'",
            freshAddresses: [],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "elrond",
            unitMagnitude: 10,
            lastSyncDate: "",
            balance: "299569965",
          },
          transactions: [
            // HERE WE WILL INSERT OUR test
          ],
        },
      ],
    },
  },
};
