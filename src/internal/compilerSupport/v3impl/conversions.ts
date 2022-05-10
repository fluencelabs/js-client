import { jsonify } from '../../utils';
import { match } from 'ts-pattern';
import { ArrowType, ArrowWithoutCallbacks, NonArrowType, UnlabeledProductType } from './interface';
import { CallServiceData } from 'src/internal/commonTypes';

/**
 * Convert value from its representation in aqua language to representation in typescript
 * @param value - value as represented in aqua
 * @param type - definition of the aqua type
 * @returns value represented in typescript
 */
export const aqua2ts = (value: any, type: NonArrowType): any => {
    const res = match(type)
        .with({ tag: 'nil' }, () => {
            return null;
        })
        .with({ tag: 'option' }, (opt) => {
            if (value.length === 0) {
                return null;
            } else {
                return aqua2ts(value[0], opt.type);
            }
        })
        .with({ tag: 'scalar' }, { tag: 'bottomType' }, { tag: 'topType' }, () => {
            return value;
        })
        .with({ tag: 'array' }, (arr) => {
            return value.map((y: any) => aqua2ts(y, arr.type));
        })
        .with({ tag: 'struct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = aqua2ts(value[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'labeledProduct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = aqua2ts(value[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'unlabeledProduct' }, (x) => {
            return x.items.map((type, index) => {
                return aqua2ts(value[index], type);
            });
        })
        // uncomment to check that every pattern in matched
        // .exhaustive();
        .otherwise(() => {
            throw new Error('Unexpected tag: ' + jsonify(type));
        });
    return res;
};

/**
 * Convert call service arguments list from their aqua representation to representation in typescript
 * @param req - call service data
 * @param arrow - aqua type definition
 * @returns arguments in typescript representation
 */
export const aquaArgs2Ts = (req: CallServiceData, arrow: ArrowWithoutCallbacks) => {
    const argTypes = match(arrow.domain)
        .with({ tag: 'labeledProduct' }, (x) => {
            return Object.values(x.fields);
        })
        .with({ tag: 'unlabeledProduct' }, (x) => {
            return x.items;
        })
        .with({ tag: 'nil' }, (x) => {
            return [];
        })
        // uncomment to check that every pattern in matched
        // .exhaustive()
        .otherwise(() => {
            throw new Error('Unexpected tag: ' + jsonify(arrow.domain));
        });

    if (req.args.length !== argTypes.length) {
        throw new Error(`incorrect number of arguments, expected: ${argTypes.length}, got: ${req.args.length}`);
    }

    return req.args.map((arg, index) => {
        return aqua2ts(arg, argTypes[index]);
    });
};

/**
 * Convert value from its typescript representation to representation in aqua
 * @param value - the value as represented in typescript
 * @param type - definition of the aqua type
 * @returns value represented in aqua
 */
export const ts2aqua = (value: any, type: NonArrowType): any => {
    const res = match(type)
        .with({ tag: 'nil' }, () => {
            return null;
        })
        .with({ tag: 'option' }, (opt) => {
            if (value === null || value === undefined) {
                return [];
            } else {
                return [ts2aqua(value, opt.type)];
            }
        })
        .with({ tag: 'scalar' }, { tag: 'bottomType' }, { tag: 'topType' }, () => {
            return value;
        })
        .with({ tag: 'array' }, (arr) => {
            return value.map((y: any) => ts2aqua(y, arr.type));
        })
        .with({ tag: 'struct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = ts2aqua(value[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'labeledProduct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = ts2aqua(value[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'unlabeledProduct' }, (x) => {
            return x.items.map((type, index) => {
                return ts2aqua(value[index], type);
            });
        })
        // uncomment to check that every pattern in matched
        // .exhaustive()
        .otherwise(() => {
            throw new Error('Unexpected tag: ' + jsonify(type));
        });

    return res;
};

/**
 * Convert return type of the service from it's typescript representation to representation in aqua
 * @param returnValue - the value as represented in typescript
 * @param arrowType - the arrow type which describes the service
 * @returns - value represented in aqua
 */
export const returnType2Aqua = (returnValue: any, arrowType: ArrowType<NonArrowType>) => {
    if (arrowType.codomain.tag === 'nil') {
        return {};
    }

    if (arrowType.codomain.items.length === 0) {
        return {};
    }

    if (arrowType.codomain.items.length === 1) {
        return ts2aqua(returnValue, arrowType.codomain.items[0]);
    }

    return arrowType.codomain.items.map((type, index) => {
        return ts2aqua(returnValue[index], type);
    });
};

/**
 * Converts response value from aqua its representation to representation in typescript
 * @param req - call service data
 * @param arrow - aqua type definition
 * @returns response value in typescript representation
 */
export const responseServiceValue2ts = (req: CallServiceData, arrow: ArrowType<any>) => {
    return match(arrow.codomain)
        .with({ tag: 'nil' }, () => {
            return undefined;
        })
        .with({ tag: 'unlabeledProduct' }, (x) => {
            if (x.items.length === 0) {
                return undefined;
            }

            if (x.items.length === 1) {
                return aqua2ts(req.args[0], x.items[0]);
            }

            return req.args.map((y, index) => aqua2ts(y, x.items[index]));
        })
        .exhaustive();
};
