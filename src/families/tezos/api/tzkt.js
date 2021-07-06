// @flow
import URL from "url";
import network from "../../../network";

type APIAccount =
  | {
      type: "empty",
      address: string,
      counter: number,
    }
  | {
      type: "user",
      address: string,
      publicKey: string,
      revealed: boolean,
      balance: number,
      counter: number,
      delegate?: {
        alias: string,
        address: string,
        active: boolean,
      },
      delegationLevel: number,
      delegationTime: string,
      numTransactions: number,
      firstActivityTime: string,
    };

type CommonOperationType = {
  type: "transaction",
  id: number,
  hash: ?string,
  storageFee?: number,
  allocationFee?: number,
  bakerFee?: number,
  timestamp: string,
  level: number,
  block: string,
  status?: "applied" | "failed" | "backtracked" | "skipped",
};

export type APIOperation =
  | {
      type: "transaction",
      amount: number,
      initiator: ?{ address: string },
      sender: ?{ address: string },
      target: ?{ address: string },
      ...CommonOperationType,
    }
  | {
      type: "reveal",
      ...CommonOperationType,
    }
  | {
      type: "delegation",
      ...CommonOperationType,
      prevDelegate: ?{ address: string },
      newDelegate: ?{ address: string },
    }
  | {
      type: "activation",
      ...CommonOperationType,
      balance: number,
    }
  | {
      type: "origination",
      ...CommonOperationType,
      contractBalance: number,
      originatedContract: {
        address: string,
      },
    }
  | {
      type: "migration",
      ...CommonOperationType,
      balanceChange: number,
    }
  | {
      type: "", // this is to express fact we have others and we need to always filter out others
    };

const api = {
  async getBlockCount(): Promise<number> {
    const { data } = await network({
      method: "GET",
      url: `https://api.tzkt.io/v1/blocks/count`,
    });
    return data;
  },
  async getAccountByAddress(address: string): Promise<APIAccount> {
    const { data } = await network({
      method: "GET",
      url: `https://api.tzkt.io/v1/accounts/${address}`,
    });
    return data;
  },
  async getAccountOperations(
    address: string,
    query: {
      lastId?: number,
      sort?: number,
    }
  ): Promise<APIOperation[]> {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `https://api.tzkt.io/v1/accounts/${address}/operations`,
        query,
      }),
    });
    return data;
  },
};

export default api;
