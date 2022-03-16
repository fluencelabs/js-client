import { jsonify } from '../../utils';
import { match } from 'ts-pattern';
import { ArrowType, ArrowWithoutCallbacks, NonArrowType, UnlabelledProductType } from './interface';

export const aqua2ts = (item: any, type: NonArrowType) => {
    const res = match(type)
        .with({ tag: 'nil' }, () => {
            return null;
        })
        .with({ tag: 'option' }, (opt) => {
            if (item.length === 0) {
                return null;
            } else {
                return aqua2ts(item[0], opt.type);
            }
        })
        .with({ tag: 'scalar' }, { tag: 'bottomType' }, { tag: 'topType' }, () => {
            return item;
        })
        .with({ tag: 'array' }, (arr) => {
            return item.map((y) => aqua2ts(y, arr.type));
        })
        .with({ tag: 'struct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = aqua2ts(item[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'labelledProduct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = aqua2ts(item[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'unlabelledProduct' }, (x) => {
            return x.items.map((type, index) => {
                return aqua2ts(item[index], type);
            });
        })
        // uncomment to check that every pattern in matched
        // .exhaustive();
        .otherwise(() => {
            throw new Error('Unexpected tag: ' + jsonify(type));
        });
    return res;
};

export const aquaArgs2Ts = (args: any[], arrow: ArrowWithoutCallbacks) => {
    const argTypes = match(arrow.domain)
        .with({ tag: 'labelledProduct' }, (x) => {
            return Object.values(x.fields);
        })
        .with({ tag: 'unlabelledProduct' }, (x) => {
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

    if (args.length !== argTypes.length) {
        throw new Error(`incorrect number of arguments, expected: ${argTypes.length}, got: ${args.length}`);
    }

    return args.map((arg, index) => {
        return aqua2ts(arg, argTypes[0]);
    });
};

export const returnType2Aqua = (returnValue: any, arrow: ArrowType<any>) => {
    if (arrow.codomain.tag === 'nil') {
        return {};
    }

    if (arrow.codomain.items.length === 0) {
        return {};
    }

    if (arrow.codomain.items.length === 1) {
        return ts2aqua(returnValue, arrow.codomain.items[0]);
    }

    return arrow.codomain.items.map((type, index) => {
        return ts2aqua(returnValue[index], type);
    });
};

export const responseArgs2ts = (rawArgs: any[], codomain: UnlabelledProductType<NonArrowType>) => {
    return match(codomain)
        .with({ tag: 'nil' }, () => {
            return null;
        })
        .with({ tag: 'unlabelledProduct' }, (x) => {
            if (x.items.length === 0) {
                return null;
            }

            if (x.items.length === 1) {
                return aqua2ts(rawArgs[0], x.items[0]);
            }

            return rawArgs.map((y, index) => aqua2ts(y, x.items[index]));
        })
        .exhaustive();
};

export const ts2aqua = (item: any, type: NonArrowType) => {
    const res = match(type)
        .with({ tag: 'nil' }, () => {
            return null;
        })
        .with({ tag: 'option' }, (opt) => {
            if (item === null) {
                return [];
            } else {
                return [ts2aqua(item, opt.type)];
            }
        })
        .with({ tag: 'scalar' }, { tag: 'bottomType' }, { tag: 'topType' }, () => {
            return item;
        })
        .with({ tag: 'array' }, (arr) => {
            return item.map((y) => ts2aqua(y, arr.type));
        })
        .with({ tag: 'struct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = ts2aqua(item[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'labelledProduct' }, (x) => {
            return Object.entries(x.fields).reduce((agg, [key, type]) => {
                const val = ts2aqua(item[key], type);
                return { ...agg, [key]: val };
            }, {});
        })
        .with({ tag: 'unlabelledProduct' }, (x) => {
            return x.items.map((type, index) => {
                return ts2aqua(item[index], type);
            });
        })
        // uncomment to check that every pattern in matched
        // .exhaustive()
        .otherwise(() => {
            throw new Error('Unexpected tag: ' + jsonify(type));
        });

    return res;
};
