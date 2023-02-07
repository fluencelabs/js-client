import { SecurityTetraplet } from '@fluencelabs/avm';
import { CallParams, PeerIdB58 } from '@fluencelabs/interface';

type ArgName = string | null;

/**
 * A predicate of call params for sig service's sign method which determines whether signing operation is allowed or not
 */
export type SecurityGuard<T extends ArgName> = (params: CallParams<T>) => boolean;

/**
 * Only allow calls when tetraplet for 'data' argument satisfies the predicate
 */
export const allowTetraplet = <T extends ArgName>(
    pred: (tetraplet: SecurityTetraplet) => boolean,
): SecurityGuard<T> => {
    return (params) => {
        const t = params.tetraplets.data[0];
        return pred(t);
    };
};

/**
 * Only allow data which comes from the specified serviceId and fnName
 */
export const allowServiceFn = <T extends ArgName>(serviceId: string, fnName: string): SecurityGuard<T> => {
    return allowTetraplet((t) => {
        return t.service_id === serviceId && t.function_name === fnName;
    });
};

/**
 * Only allow data originated from the specified json_path
 */
export const allowExactJsonPath = <T extends ArgName>(jsonPath: string): SecurityGuard<T> => {
    return allowTetraplet((t) => {
        return t.json_path === jsonPath;
    });
};

/**
 * Only allow signing when particle is initiated at the specified peer
 */
export const allowOnlyParticleOriginatedAt = <T extends ArgName>(peerId: PeerIdB58): SecurityGuard<T> => {
    return (params) => {
        return params.initPeerId === peerId;
    };
};

/**
 * Only allow signing when all of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const and = <T extends ArgName>(...predicates: SecurityGuard<T>[]): SecurityGuard<T> => {
    return (params) => predicates.every((x) => x(params));
};

/**
 * Only allow signing when any of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const or = <T extends ArgName>(...predicates: SecurityGuard<T>[]): SecurityGuard<T> => {
    return (params) => predicates.some((x) => x(params));
};
