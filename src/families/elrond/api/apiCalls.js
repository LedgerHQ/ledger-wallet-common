import network from "../../../network";
import { HASH_TRANSACTION, RAW_TRANSACTION } from "../constants";

export default class ElrondApi {
  constructor(API_URL: String) {
    this.API_URL = API_URL;
  }

  async getAccountDetails(addr: String) {
    const {
      data: { balance, nonce },
    } = await network({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}`,
    });

    return { balance, nonce };
  }

  async getValidators() {
    let data = [];
    try {
      let {
        data: { validators },
      } = await network({
        method: "GET",
        url: `${this.API_URL}/validator/statistics`,
      });
      data = validators;
    } catch (error) {
      return data;
    }

    return data;
  }

  async getNetworkConfig() {
    const {
      data: {
        data: {
          config: {
            erd_chain_id: chainId,
            erd_denomination: denomination,
            erd_min_gas_limit: gasLimit,
            erd_min_gas_price: gasPrice,
            erd_gas_per_data_byte: gasPerByte,
          },
        },
      },
    } = await network({
      method: "GET",
      url: `${this.API_URL}/network/config`,
    });

    return { chainId, denomination, gasLimit, gasPrice, gasPerByte };
  }

  async submit({ operation, signature, signUsingHash }) {
    const { chainId, gasLimit, gasPrice } = await this.getNetworkConfig();

    const transactionType = signUsingHash ? HASH_TRANSACTION : RAW_TRANSACTION;

    const {
      senders: [sender],
      recipients: [receiver],
      value,
      transactionSequenceNumber: nonce,
    } = operation;

    const {
      data: {
        data: { txHash: hash },
      },
    } = await network({
      method: "POST",
      url: `${this.API_URL}/transaction/send`,
      data: {
        nonce,
        value,
        receiver,
        sender,
        gasPrice,
        gasLimit,
        chainID: chainId,
        signature,
        ...transactionType,
      },
    });

    return { hash };
  }

  async getHistory(addr: string, startAt: Number) {
    const { data: transactions } = await network({
      method: "GET",
      url: `${this.API_URL}/transactions?condition=should&sender=${addr}&receiver=${addr}&after=${startAt}`,
    });

    if (!transactions.length) return transactions; //Account does not have any transactions

    return Promise.all(
      transactions.map(async (transaction) => {
        const { blockHeight, blockHash } = await this.getConfirmedTransaction(
          transaction.txHash
        );

        return { ...transaction, blockHash, blockHeight };
      })
    );
  }

  async getBlockchainBlockHeight() {
    const {
      data: [{ nonce: blockHeight }],
    } = await network({
      method: "GET",
      url: `${this.API_URL}/blocks?shard=4294967295&fields=nonce`,
    });

    return blockHeight;
  }

  async getConfirmedTransaction(txHash: string) {
    const {
      data: {
        data: {
          transaction: { hyperblockNonce, blockHash },
        },
      },
    } = await network({
      method: "GET",
      url: `${this.API_URL}/transaction/${txHash}`,
    });

    return { blockHeight: hyperblockNonce, blockHash };
  }
}
