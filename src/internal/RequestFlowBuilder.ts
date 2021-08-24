import log from 'loglevel';
import { CallServiceHandler, CallServiceResultType } from './CallServiceHandler';
import { DEFAULT_TTL, RequestFlow } from './RequestFlow';

export const loadVariablesService = 'load';
const loadVariablesFn = 'load_variable';
export const loadRelayFn = 'load_relay';
const xorHandleService = '__magic';
const xorHandleFn = 'handle_xor';
export const relayVariableName = 'init_relay';

const wrapWithXor = (script: string): string => {
    return `
    (xor
        ${script}
        (xor
            (match ${relayVariableName} ""
                (call %init_peer_id% ("${xorHandleService}" "${xorHandleFn}") [%last_error%])
            )
            (seq 
                (call ${relayVariableName} ("op" "identity") [])
                (call %init_peer_id% ("${xorHandleService}" "${xorHandleFn}") [%last_error%])
            )
        )
    )`;
};

class ScriptBuilder {
    private script: string;
    private isXorInjected: boolean;
    private shouldInjectRelay: boolean;
    private variables: string[] = [];

    constructor() {
        this.isXorInjected = false;
        this.shouldInjectRelay = false;
    }

    raw(script: string): ScriptBuilder {
        this.script = script;
        return this;
    }

    withInjectedVariables(fields: string[]): ScriptBuilder {
        this.variables = [...this.variables, ...fields];
        return this;
    }

    wrappedWithXor(): ScriptBuilder {
        this.isXorInjected = true;
        return this;
    }

    withInjectedRelay(): ScriptBuilder {
        this.shouldInjectRelay = true;
        return this;
    }

    build(): string {
        let script = this.script;
        if (this.withInjectedVariables && this.withInjectedVariables.length > 0) {
            script = wrapWithVariableInjectionScript(script, this.variables);
        }
        if (this.isXorInjected) {
            script = wrapWithXor(script);
        }
        if (this.shouldInjectRelay) {
            script = wrapWithInjectRelayScript(script);
        }
        return script;
    }
}

const wrapWithVariableInjectionScript = (script: string, fields: string[]): string => {
    fields.forEach((v) => {
        script = `
(seq
    (call %init_peer_id% ("${loadVariablesService}" "${loadVariablesFn}") ["${v}"] ${v})
    ${script}
)`;
    });

    return script;
};

const wrapWithInjectRelayScript = (script: string): string => {
    return `
(seq
    (call %init_peer_id% ("${loadVariablesService}" "${loadRelayFn}") [] ${relayVariableName})
    ${script}
)`;
};

/**
 * Builder class for configuring and creating Request Flows
 */
export class RequestFlowBuilder {
    private shouldInjectVariables: boolean = true;
    private shouldInjectErrorHandling: boolean = true;
    private shouldInjectRelay: boolean = true;

    private ttl: number = DEFAULT_TTL;
    private variables = new Map<string, CallServiceResultType>();
    private handlerConfigs: Array<(handler: CallServiceHandler, request: RequestFlow) => void> = [];
    private buildScriptActions: Array<(sb: ScriptBuilder) => void> = [];
    private onTimeout: () => void;
    private onError: (error: any) => void;

    /**
     * Builds the Request flow with current configuration
     */
    build() {
        if (this.shouldInjectRelay) {
            this.injectRelay();
        }
        if (this.shouldInjectVariables) {
            this.injectVariables();
        }
        if (this.shouldInjectErrorHandling) {
            this.wrapWithXor();
        }

        const sb = new ScriptBuilder();
        for (let action of this.buildScriptActions) {
            action(sb);
        }
        let script = sb.build();

        const res = RequestFlow.createLocal(script, this.ttl);

        for (let h of this.handlerConfigs) {
            h(res.handler, res);
        }

        if (this.onTimeout) {
            res.onTimeout(this.onTimeout);
        }
        if (this.onError) {
            res.onError(this.onError);
        }

        return res;
    }

    /**
     * Removes necessary defaults when building requests by hand without the Aqua language compiler
     * Removed features include: relay and variable injection, error handling with top-level xor wrap
     */
    disableInjections(): RequestFlowBuilder {
        this.shouldInjectRelay = false;
        this.shouldInjectVariables = false;
        this.shouldInjectErrorHandling = false;
        return this;
    }

    /**
     * Injects `init_relay` variable into the script
     */
    injectRelay(): RequestFlowBuilder {
        this.configureScript((sb) => {
            sb.withInjectedRelay();
        });

        return this;
    }

    /**
     * Registers services for variable injection. Required for variables registration to work
     */
    injectVariables(): RequestFlowBuilder {
        this.configureScript((sb) => {
            sb.withInjectedVariables(Array.from(this.variables.keys()));
        });

        this.configHandler((h) => {
            h.on(loadVariablesService, loadVariablesFn, async (args, _) => {
                if (this.variables.has(args[0])) {
                    return this.variables.get(args[0]);
                }

                throw new Error(`failed to inject variable: ${args[0]}`);
            });
        });

        return this;
    }

    /**
     * Wraps the script with top-level error handling with xor instruction. Will raise error in the Request Flow in xor catches any error
     */
    wrapWithXor(): RequestFlowBuilder {
        this.configureScript((sb) => {
            sb.wrappedWithXor();
        });

        this.configHandler((h, request) => {
            h.onEvent(xorHandleService, xorHandleFn, async (args) => {
                if (args[0] === undefined) {
                    log.error(
                        'Request flow error handler recieved unexpected argument, value of %last_error% is undefined',
                    );
                }

                try {
                    request.raiseError(args[0]);
                } catch (e) {
                    log.error('Error handling script executed with error', e);
                }
            });
        });

        return this;
    }

    /**
     * Use ScriptBuilder provided by action in argument to configure script of the Request Flow
     */
    configureScript(action: (sb: ScriptBuilder) => void): RequestFlowBuilder {
        this.buildScriptActions.push(action);
        return this;
    }

    /**
     * Use raw text as script for the Request Flow
     */
    withRawScript(script: string): RequestFlowBuilder {
        this.buildScriptActions.push((sb) => {
            sb.raw(script);
        });

        return this;
    }

    /**
     * Specify time to live for the request
     */
    withTTL(ttl?: number): RequestFlowBuilder {
        if (ttl) {
            this.ttl = ttl;
        }
        return this;
    }

    /**
     * Configure local call handler for the Request Flow
     */
    configHandler(config: (handler: CallServiceHandler, request: RequestFlow) => void): RequestFlowBuilder {
        this.handlerConfigs.push(config);
        return this;
    }

    /**
     * Specifies handler for the particle timeout event
     */
    handleTimeout(handler: () => void): RequestFlowBuilder {
        this.onTimeout = handler;
        return this;
    }

    /**
     * Specifies handler for any script errors
     */
    handleScriptError(handler: (error) => void): RequestFlowBuilder {
        this.onError = handler;
        return this;
    }

    /**
     * Adds a variable to the list of injected variables
     */
    withVariable(name: string, value: CallServiceResultType): RequestFlowBuilder {
        this.variables.set(name, value);
        return this;
    }

    /**
     * Adds a multiple variable to the list of injected variables.
     * Variables can be specified in form of either object or a map where keys correspond to variable names
     */
    withVariables(
        data: Map<string, CallServiceResultType> | Record<string, CallServiceResultType>,
    ): RequestFlowBuilder {
        if (data instanceof Map) {
            this.variables = new Map([...Array.from(this.variables.entries()), ...Array.from(data.entries())]);
        } else {
            for (let k in data) {
                this.variables.set(k, data[k]);
            }
        }

        return this;
    }

    /**
     * Builds the Request flow with current configuration with a fetch-single-result semantics
     * returns a tuple of [RequestFlow, promise] where promise is a fetch-like promise resolved when
     * the execution hits callback service and rejected when particle times out or any error happens
     */
    buildAsFetch<T>(
        callbackServiceId: string = 'callback',
        callbackFnName: string = 'callback',
    ): [RequestFlow, Promise<T>] {
        const fetchPromise = new Promise<T>((resolve, reject) => {
            this.handlerConfigs.push((h) => {
                h.onEvent(callbackServiceId, callbackFnName, async (args, _) => {
                    resolve(args as any);
                });
            });

            this.handleTimeout(() => {
                reject(`Timed out after ${this.ttl}ms`);
            });

            this.handleScriptError((e) => {
                reject(e);
            });
        });

        return [this.build(), fetchPromise];
    }

    /**
     * Builds the Request flow with current configuration with error handling
     * returns a tuple of [RequestFlow, promise]. The promise is never resolved and rejected in case of any error in the script
     */
    buildWithErrorHandling(): [RequestFlow, Promise<void>] {
        const promise = new Promise<void>((resolve, reject) => {
            this.handleScriptError(reject);
        });

        return [this.build(), promise];
    }
}
