// @flow
import BigNumber from "bignumber.js";
import type { AxiosInstance } from "axios";
import axios from "axios";
import axiosRetry from "axios-retry";
import https from "https";
import { findIndex } from "lodash";

import type { Account } from "../../../types/account";
import { getEnv } from "../../../env";

//import { IExplorer } from "./types";
//import EventEmitter from "../utils/eventemitter";
import { Address, TX } from "./types";

// FIXME Should be typed AxiosInstance
let client = undefined;

const getClient = () => {
  if (!client) {
    client = axios.create({
      baseURL: getEnv("API_BITCOIN_EXPLORER_LEDGER"),
      // uses max 20 keep alive request in parallel
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 20 }),
    });

    // 3 retries per request
    axiosRetry(client, { retries: 3 });
  }
  return client;
};

const getAddressTxsSinceLastTxBlock = async (
  batchSize: number,
  address: Address,
  lastTx: TX | undefined
) => {
  let params = {
    no_token: "true",
    batch_size: batchSize,
    block_hash: null,
  };

  if (lastTx) {
    params.block_hash = lastTx.block.hash;
  }

  const url = `/addresses/${address.address}/transactions`;

  //this.emit("fetching-address-transaction", { url, params });

  // TODO add a test for failure (at the sync level)
  const res: { txs: TX[] } = (
    await getClient().get(url, {
      params,
    })
  ).data;

  // explorer returns pending tx without block at the beginning of any request
  // we get rid of them
  const firstNonPendingIndex = findIndex(res.txs, (tx) => !!tx.block);

  const txs = res.txs.slice(firstNonPendingIndex, res.txs.length);

  txs.forEach((tx) => {
    // no need to keep that as it changes
    //delete tx.confirmations;

    tx.account = address.account;
    tx.index = address.index;
    tx.address = address.address;

    tx.outputs.forEach((output) => {
      output.output_hash = tx.id;
    });
  });

  //this.emit("fetched-address-transaction", { url, params, txs });

  return txs;
};

export const getTransactions = async (
  address: String,
  startAt: BigNumber
): Promise<TX[]> => {
  // TODO call or rework getAddressTxsSinceLastTxBlock
  return [];
};

export const getTxHex = async (txId: string) => {
  const url = `/transactions/${txId}/hex`;

  //this.emit("fetching-transaction-tx", { url, txId });

  // TODO add a test for failure (at the sync level)
  const res = (await getClient().get(url)).data;

  return res[0].hex;
};

export const getFees = async (account: Account): Promise<BigNumber[]> => {
  // TODO

  // libcore impl:
  /*
  bool parseNumbersAsString = true;
  auto networkId = getNetworkParameters().Identifier;
  return _http->GET(fmt::format("/blockchain/{}/{}/fees", getExplorerVersion(), networkId))
      .json(parseNumbersAsString).map<std::vector<std::shared_ptr<api::BigInt>>>(getExplorerContext(), [networkId] (const HttpRequest::JsonResult& result) {
      auto& json = *std::get<1>(result);
      if (!json.IsObject()) {
          throw make_exception(api::ErrorCode::HTTP_ERROR, "Failed to get fees for {}", networkId);
      }

      // Here we filter fields returned by this endpoint,
      // if the field's key is a number (number of confirmations) then it's an acceptable fee
      auto isValid = [] (const std::string &field) -> bool {
          return !field.empty() && std::find_if(field.begin(), field.end(), [](char c) { return !std::isdigit(c); }) == field.end();
      };
      std::vector<std::shared_ptr<api::BigInt>> fees;
      for (auto& item : json.GetObject()) {
          if (item.name.IsString() && item.value.IsString() && isValid(item.name.GetString())){
          fees.push_back(std::make_shared<api::BigIntImpl>(BigInt::fromString(item.value.GetString())));
          }
      }
      return fees;
      });
  */

  return [];
};

export const broadcastTransaction = (signature: string): string => {
  // TODO Call the explorer endpoint and return the hash in response
  return "";
};
