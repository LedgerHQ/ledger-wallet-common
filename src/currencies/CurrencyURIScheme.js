// @flow
import querystring from "querystring";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "../types";
import { findCryptoCurrencyByScheme } from "@ledgerhq/cryptoassets";
// see https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki

type Data = {
  address: string,
  currency?: CryptoCurrency,
  amount?: BigNumber, // IN SATOSHI !! not in actual 'real' value
  // ... any other field specific to a coin that will be put in query
  userGasLimit?: BigNumber,
  gasPrice?: BigNumber,
};

export function encodeURIScheme(data: Data): string {
  const { currency, address, amount, ...specificFields } = data;
  const query: Object = { ...specificFields };
  if (!currency) return address;
  if (amount) {
    const { magnitude } = currency.units[0];
    query.amount = amount.div(BigNumber(10).pow(magnitude)).toNumber();
  }
  const queryStr = querystring.stringify(query);
  return currency.scheme + ":" + address + (queryStr ? "?" + queryStr : "");
}

const convertedValue = (value, currency: CryptoCurrency) => {
  let float = BigNumber(value);
  if (!float.isNaN() && float.gt(0)) {
    const { magnitude } = currency.units[0];
    return float.times(BigNumber(10).pow(magnitude));
  }
};

export function decodeURIScheme(str: string): Data {
  const m = str.match(/(([a-zA-Z]+):)?([^?]+)(\?(.+))?/);
  if (!m) {
    // as a fallback we'll fallback str to be an address
    return { address: str };
  }
  const [, , scheme, address, , queryStr] = m;
  const query: Object = queryStr ? querystring.parse(queryStr) : {};
  const currency = findCryptoCurrencyByScheme(scheme);
  if (!currency) {
    return { address };
  }
  const data: Data = {
    currency,
    address,
  };
  const { amount, ...specificFields } = { ...query };
  if (currency.name === "Ethereum") {
    (specificFields.parameters || []).forEach((param) => {
      let cValue;
      switch (param) {
        case "value":
          cValue = convertedValue(specificFields.value, currency);
          if (cValue) {
            data.amount = cValue;
          }
          break;
        case "gas":
          data.userGasLimit = BigNumber(specificFields.gas);
          break;
        case "gasPrice":
          cValue = convertedValue(specificFields.gasPrice, currency);
          if (cValue) {
            data.gasPrice = cValue;
          }
          break;
        case "gasLimit":
          // ?
          break;
        default:
          break;
      }
    });
    delete specificFields.parameters;
  }
  Object.assign(data, specificFields);
  if (amount) {
    const cValue = convertedValue(amount, currency);
    if (cValue) {
      data.amount = cValue;
    }
  }
  return data;
}
