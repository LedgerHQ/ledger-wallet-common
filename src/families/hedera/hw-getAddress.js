// @flow

import type { Resolver } from '../../hw/getAddress/types';
import Hedera from './hw-app-hedera/Hedera';

const resolver: Resolver = async (transport, { path, verify }) => {
  const hedera = new Hedera(transport);

  const r = await hedera.getAddress(path, verify);

  return {
    address: r.address,
    publicKey: r.publicKey,
    path
  };
};

export default resolver;
