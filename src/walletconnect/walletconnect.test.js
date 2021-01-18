// @flow
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { getAccountBridge } from "../bridge";
import { parseCallRequest } from "./index";
import type { WCPayloadTransaction } from "./index";
import { getCryptoCurrencyById, setSupportedCurrencies } from "../currencies";
import type { Account } from "../types/account";
import { setEnv } from "../env";

describe("walletconnect", () => {
  const account: Account = {
    type: "Account",
    id: "js:2:ethereum:0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a:",
    derivationMode: "",
    freshAddressPath: "44'/60'/0'/0/0",
    currency: getCryptoCurrencyById("ethereum"),
    seedIdentifier: "",
    index: 0,
    freshAddress: "",
    freshAddresses: [],
    name: "test",
    starred: false,
    balance: BigNumber(0),
    spendableBalance: BigNumber(0),
    creationDate: new Date(),
    blockHeight: 1,
    unit: getCryptoCurrencyById("ethereum").units[0],
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    swapHistory: [],
  };

  beforeAll(() => {
    setEnv("MOCK", true);
    setSupportedCurrencies(["ethereum"]);
  });
  afterAll(() => {
    setEnv("MOCK", false);
  });

  test("should fail on wrong payload", async () => {
    await expect(
      parseCallRequest(account, {
        method: "pouet",
        params: [],
        id: "pouet",
      })
    ).rejects.toThrow("wrong payload");
  });

  test("should parse personal_sign payloads", async () => {
    expect(
      await parseCallRequest(account, {
        id: "1606134269395933",
        jsonrpc: "2.0",
        method: "personal_sign",
        params: [
          "0x4d7920656d61696c206973206a6f686e40646f652e636f6d202d2031353337383336323036313031",
          "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
        ],
      })
    ).toMatchObject({
      data: {
        currency: getCryptoCurrencyById("ethereum"),
        derivationMode: "",
        message: "My email is john@doe.com - 1537836206101",
        path: "44'/60'/0'/0/0",
      },
      type: "message",
    });
  });

  test("should parse eth_signTypedData payloads", async () => {
    const raw =
      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"verifyingContract","type":"address"}],"RelayRequest":[{"name":"target","type":"address"},{"name":"encodedFunction","type":"bytes"},{"name":"gasData","type":"GasData"},{"name":"relayData","type":"RelayData"}],"GasData":[{"name":"gasLimit","type":"uint256"},{"name":"gasPrice","type":"uint256"},{"name":"pctRelayFee","type":"uint256"},{"name":"baseRelayFee","type":"uint256"}],"RelayData":[{"name":"senderAddress","type":"address"},{"name":"senderNonce","type":"uint256"},{"name":"relayWorker","type":"address"},{"name":"paymaster","type":"address"}]},"domain":{"name":"GSN Relayed Transaction","version":"1","chainId":42,"verifyingContract":"0x6453D37248Ab2C16eBd1A8f782a2CBC65860E60B"},"primaryType":"RelayRequest","message":{"target":"0x9cf40ef3d1622efe270fe6fe720585b4be4eeeff","encodedFunction":"0xa9059cbb0000000000000000000000002e0d94754b348d208d64d52d78bcd443afa9fa520000000000000000000000000000000000000000000000000000000000000007","gasData":{"gasLimit":"39507","gasPrice":"1700000000","pctRelayFee":"70","baseRelayFee":"0"},"relayData":{"senderAddress":"0x22d491bde2303f2f43325b2108d26f1eaba1e32b","senderNonce":"3","relayWorker":"0x3baee457ad824c94bd3953183d725847d023a2cf","paymaster":"0x957F270d45e9Ceca5c5af2b49f1b5dC1Abb0421c"}}}';

    expect(
      await parseCallRequest(account, {
        id: "1606135178131543",
        jsonrpc: "2.0",
        method: "eth_signTypedData",
        params: ["0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a", raw],
      })
    ).toMatchObject({
      data: {
        currency: getCryptoCurrencyById("ethereum"),
        derivationMode: "",
        message: JSON.parse(raw),
        path: "44'/60'/0'/0/0",
      },
      type: "message",
    });
  });

  test("should parse eth_sendTransaction payloads", async () => {
    const raw: WCPayloadTransaction = {
      data: "0x",
      from: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      gas: "0x5208",
      gasPrice: "0xb2d05e000",
      nonce: "0x15",
      to: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      value: "0x0",
    };

    const bridge = getAccountBridge(account);
    let transaction = bridge.createTransaction(account);

    transaction = bridge.updateTransaction(transaction, {
      data: Buffer.from(raw.data.slice(2), "hex"),
      // $FlowFixMe
      amount: BigNumber(raw.value, 16),
      recipient: raw.to,
      // $FlowFixMe
      gasPrice: BigNumber(raw.gasPrice, 16),
      nonce: raw.nonce,
    });
    transaction = bridge.updateTransaction(transaction, {
      // $FlowFixMe
      userGasLimit: BigNumber(raw.gas, 16),
    });

    transaction = await bridge.prepareTransaction(account, transaction);
    delete transaction.networkInfo;

    expect(
      await parseCallRequest(account, {
        id: "1606135657415541",
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [raw],
      })
    ).toMatchObject({
      data: transaction,
      method: "send",
      type: "transaction",
    });
  });

  test.only("should parse eth_sendTransaction payloads and include abi if erc20", async () => {
    const raw: WCPayloadTransaction = {
      data:
        "0x095ea7b30000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      from: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      gas: "0x5208",
      gasPrice: "0xb2d05e000",
      nonce: "0x15",
      to: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      value: "0x0",
    };

    const bridge = getAccountBridge(account);
    let transaction = bridge.createTransaction(account);

    transaction = bridge.updateTransaction(transaction, {
      data: Buffer.from(raw.data.slice(2), "hex"),
      // $FlowFixMe
      amount: BigNumber(raw.value, 16),
      recipient: raw.to,
      // $FlowFixMe
      gasPrice: BigNumber(raw.gasPrice, 16),
      nonce: raw.nonce,
    });
    transaction = bridge.updateTransaction(transaction, {
      // $FlowFixMe
      userGasLimit: BigNumber(raw.gas, 16),
    });

    transaction = await bridge.prepareTransaction(account, transaction);
    delete transaction.networkInfo;

    expect(
      await parseCallRequest(account, {
        id: "1606135657415541",
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [raw],
      })
    ).toMatchObject({
      data: transaction,
      method: "send",
      type: "transaction",
      abi: {
        name: "approve",
        params: [
          {
            name: "_spender",
            value: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
            type: "address"
          },
          {
            name: "_value",
            value:
              "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            type: "uint256",
          },
        ],
      },
    });
  });

  test("should parse eth_sendTransaction payloads and eip55 encode lowercase addresses", async () => {
    const raw: WCPayloadTransaction = {
      data: "0x",
      from: "0xCA220B75b7aF206bFCc67E2EcE06E2e144FA294a",
      gas: "0x5208",
      gasPrice: "0xb2d05e000",
      nonce: "0x15",
      to: "0xca220b75b7af206bfcc67e2ece06e2e144fa294a",
      value: "0x0",
    };

    const bridge = getAccountBridge(account);
    let transaction = bridge.createTransaction(account);

    transaction = bridge.updateTransaction(transaction, {
      data: Buffer.from(raw.data.slice(2), "hex"),
      // $FlowFixMe
      amount: BigNumber(raw.value, 16),
      recipient: eip55.encode(raw.to),
      // $FlowFixMe
      gasPrice: BigNumber(raw.gasPrice, 16),
      nonce: raw.nonce,
    });
    transaction = bridge.updateTransaction(transaction, {
      // $FlowFixMe
      userGasLimit: BigNumber(raw.gas, 16),
    });

    transaction = await bridge.prepareTransaction(account, transaction);
    delete transaction.networkInfo;

    expect(
      await parseCallRequest(account, {
        id: "1606135657415541",
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [raw],
      })
    ).toMatchObject({
      data: transaction,
      method: "send",
      type: "transaction",
    });
  });
});
