// @flow
import type { Operation, SignedOperation } from '../../types';
import { patchOperationWithHash } from '../../operation';

import { submit } from './api';

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast = async ({
    signedOperation: { signature, operation }
}: {
    signedOperation: SignedOperation
}): Promise<Operation> => {
    const { hash } = await submit(signature);

    return patchOperationWithHash(operation, hash);
};

export default broadcast;
