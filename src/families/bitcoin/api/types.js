// @flow

// TODO Review all

export interface TX {
  id: string;
  account: number;
  index: number;
  block: Block;
  address: string;
  inputs: Input[];
  outputs: Output[];
}

export interface Input {
  value: number;
  address: string;
  output_hash: string;
  output_index: number;
}

export interface Output {
  value: number;
  address: string;
  output_hash: string;
  output_index: number;
}

export interface Block {
  height: number;
  hash: string;
}

export interface Address {
  account: number;
  index: number;
  address: string;
}

export interface IStorage {
  appendTxs(txs: TX[]): Promise<number>;
  getAddressUnspentUtxos(address: Address): Promise<Output[]>;
  getLastTx(txFilter: {
    account?: number,
    index?: number,
  }): Promise<TX | undefined>;
  getUniquesAddresses(addressesFilter: {
    account?: number,
    index?: number,
  }): Promise<Address[]>;
  toString(sort?: (txs: TX[]) => TX[]): Promise<string>;
  load(file: string): Promise<void>;
}

// abstract explorer api used, abstract batching logic, pagination, and retries
export interface IExplorer {
  on(event: "fetching-address-transaction", listener: () => void): this;
  on(event: "fetched-address-transaction", listener: () => void): this;

  getTxHex(txId: string): Promise<string>;
  getAddressTxsSinceLastTxBlock(
    batchSize: number,
    address: Address,
    lastTx: TX | undefined
  ): Promise<TX[]>;
}
