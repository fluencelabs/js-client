export interface CallServiceResult {
    ret_code: number;
    result: string;
}

export type ParticleHandler = (
    serviceId: string,
    fnName: string,
    args: any[],
    tetraplets: SecurityTetraplet[][],
) => CallServiceResult;

export interface StepperOutcome {
    ret_code: number;
    data: Uint8Array;
    next_peer_pks: string[];
}

export interface ResolvedTriplet {
    peer_pk: string;
    service_id: string;
    function_name: string;
}

export interface SecurityTetraplet extends ResolvedTriplet {
    json_path: string;
}
