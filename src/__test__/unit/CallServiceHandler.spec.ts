import { CallServiceHandler, ResultCodes } from '../../internal/CallServiceHandler';
import { errorHandler } from '../../internal/defaultMiddlewares';

const req = () => ({
    serviceId: 'service',
    fnName: 'fn name',
    args: [],
    tetraplets: [],
    particleContext: {
        particleId: 'id',
        initPeerId: 'init peer id',
        timeStamp: 595951200,
        ttl: 595961200,
        signature: 'sig',
    },
});

const res = () => ({
    res,
});

describe('Call service handler tests', () => {
    it('Should work without middlewares', () => {
        // arrange
        const handler = new CallServiceHandler();

        // act
        const res = handler.execute(req());

        // assert
        expect(res).not.toBeUndefined();
    });

    it('Should work with no-op middleware', () => {
        // arrange
        const handler = new CallServiceHandler();
        handler.use((req, res, next) => {
            next();
        });

        // act
        const res = handler.execute(req());

        // assert
        expect(res).not.toBeUndefined();
    });

    it('Should work with two overlapping middlewares', () => {
        // arrange
        const handler = new CallServiceHandler();
        handler
            .use((req, res, next) => {
                res.result = { hello: 'world' };
            })
            .use((req, res, next) => {
                res.result = { hello: 'incorect' };
                next();
            });

        // act
        const res = handler.execute(req());

        // assert
        expect(res).toMatchObject({
            result: { hello: 'world' },
        });
    });

    it('Should work with two NON-overlapping middlewares', () => {
        // arrange
        const handler = new CallServiceHandler();
        handler
            .use((req, res, next) => {
                res.result = {};
                next();
            })
            .use((req, res, next) => {
                (res.result as any).name = 'john';
                next();
            })
            .use((req, res, next) => {
                (res.result as any).color = 'red';
                next();
            });

        // act
        const res = handler.execute(req());

        // assert
        expect(res).toMatchObject({
            result: { name: 'john', color: 'red' },
        });
    });

    it('Should work with provided error handling middleware', () => {
        // arrange
        const handler = new CallServiceHandler();

        handler.use(errorHandler);
        handler.use((req, res, next) => {
            throw new Error('some error');
        });

        // act
        const res = handler.execute(req());

        // assert
        expect(res).toMatchObject({
            retCode: ResultCodes.exceptionInHandler,
            result: 'Handler failed. fnName="fn name" serviceId="service" error: Error: some error',
        });
    });

    describe('Service handler tests', () => {
        it('Should register service function', () => {
            // arrange
            const handler = new CallServiceHandler();
            handler.on('service', 'function', (args) => {
                return { called: args };
            });

            // act
            const res = handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function',
                args: ['hello', 'world'],
            });

            // assert
            expect(res).toMatchObject({
                retCode: ResultCodes.success,
                result: { called: ['hello', 'world'] },
            });
        });

        it('Should UNregister service function', () => {
            // arrange
            const handler = new CallServiceHandler();
            const unreg = handler.on('service', 'function', (args) => {
                return { called: args };
            });
            unreg();

            // act
            const res = handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function',
                args: ['hello', 'world'],
            });

            // assert
            expect(res).toMatchObject({
                retCode: ResultCodes.unkownError,
            });
        });

        it('Should register event', async () => {
            // arrange
            const handler = new CallServiceHandler();
            const returnPromise = new Promise((resolve) => {
                handler.onEvent('service', 'function', (args) => {
                    resolve({ called: args });
                });
            });
            handler.onEvent('service', 'function', (args) => {
                return { called: args };
            });

            // act
            const res = handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function',
                args: ['hello', 'world'],
            });

            // assert
            await expect(returnPromise).resolves.toMatchObject({ called: ['hello', 'world'] });
        });

        it('Should UNregister event', () => {
            // arrange
            const handler = new CallServiceHandler();
            const unreg = handler.onEvent('service', 'function', (args) => {
                // don't care
            });
            unreg();

            // act
            const res = handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function',
                args: ['hello', 'world'],
            });

            // assert
            expect(res).toMatchObject({
                retCode: ResultCodes.unkownError,
            });
        });

        it('Should register multiple service functions', () => {
            // arrange
            const handler = new CallServiceHandler();
            handler.on('service', 'function1', (args) => {
                return 'called function1';
            });
            handler.on('service', 'function2', (args) => {
                return 'called function2';
            });

            // act
            const res1 = handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function1',
            });
            const res2 = handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function2',
            });

            // assert
            expect(res1).toMatchObject({
                retCode: ResultCodes.success,
                result: 'called function1',
            });
            expect(res2).toMatchObject({
                retCode: ResultCodes.success,
                result: 'called function2',
            });
        });

        it('Should override previous function registration', () => {
            // arrange
            const handler = new CallServiceHandler();
            handler.on('service', 'function', (args) => {
                return { called: args };
            });
            handler.on('service', 'function', (args) => {
                return 'overridden';
            });

            // act
            const res = handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function',
            });

            // assert
            expect(res).toMatchObject({
                retCode: ResultCodes.success,
                result: 'overridden',
            });
        });
    });

    describe('Middleware combination tests', () => {
        it('Should work with NON overlapping function registration', () => {
            // arrange
            const base = new CallServiceHandler();
            base.on('service', 'function1', (args) => {
                return 'called function1';
            });
            const another = new CallServiceHandler();
            base.on('service', 'function2', (args) => {
                return 'called function2';
            });

            base.combineWith(another);

            // act
            const res1 = base.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function1',
            });
            const res2 = base.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function2',
            });

            // assert
            expect(res1).toMatchObject({
                retCode: ResultCodes.success,
                result: 'called function1',
            });
            expect(res2).toMatchObject({
                retCode: ResultCodes.success,
                result: 'called function2',
            });
        });

        it('Should work with overlapping function registration', () => {
            // arrange
            const base = new CallServiceHandler();
            base.on('service', 'function', (args) => {
                return { called: args };
            });
            const another = new CallServiceHandler();
            another.on('service', 'function', (args) => {
                return 'overridden';
            });

            base.combineWith(another);

            // act
            const res = base.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function',
            });

            // assert
            expect(res).toMatchObject({
                retCode: ResultCodes.success,
                result: 'overridden',
            });
        });
    });
});
