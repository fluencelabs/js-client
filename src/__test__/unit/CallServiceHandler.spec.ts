import { CallServiceData, CallServiceHandler, ResultCodes } from '../../internal/CallServiceHandler';
import { errorHandler } from '../../internal/defaultMiddlewares';

const req = (): CallServiceData => ({
    serviceId: 'service',
    fnName: 'fn name',
    args: [],
    tetraplets: [],
    particleContext: {
        particleId: 'id',
        initPeerId: 'init peer id',
        timestamp: 595951200,
        ttl: 595961200,
        signature: 'sig',
    },
});

describe('Call service handler tests', () => {
    it('Should work without middlewares', async () => {
        // arrange
        const handler = new CallServiceHandler();

        // act
        const res = await handler.execute(req());

        // assert
        expect(res).not.toBeUndefined();
    });

    it('Should work with no-op middleware', async () => {
        // arrange
        const handler = new CallServiceHandler();
        handler.use(async (req, res, next) => {
            await next();
        });

        // act
        const res = await handler.execute(req());

        // assert
        expect(res).not.toBeUndefined();
    });

    it('Should work with two overlapping middlewares', async () => {
        // arrange
        const handler = new CallServiceHandler();
        handler
            .use(async (req, res, next) => {
                res.result = { hello: 'world' };
            })
            .use(async (req, res, next) => {
                res.result = { hello: 'incorect' };
                await next();
            });

        // act
        const res = await handler.execute(req());

        // assert
        expect(res).toMatchObject({
            result: { hello: 'world' },
        });
    });

    it('Should work with two NON-overlapping middlewares', async () => {
        // arrange
        const handler = new CallServiceHandler();
        handler
            .use(async (req, res, next) => {
                res.result = {};
                await next();
            })
            .use(async (req, res, next) => {
                (res.result as any).name = 'john';
                await next();
            })
            .use(async (req, res, next) => {
                (res.result as any).color = 'red';
                await next();
            });

        // act
        const res = await handler.execute(req());

        // assert
        expect(res).toMatchObject({
            result: { name: 'john', color: 'red' },
        });
    });

    it('Should work with provided error handling middleware', async () => {
        // arrange
        const handler = new CallServiceHandler();

        handler.use(errorHandler);
        handler.use(async (req, res, next) => {
            throw new Error('some error');
        });

        // act
        const res = await handler.execute(req());

        // assert
        expect(res).toMatchObject({
            retCode: ResultCodes.exceptionInHandler,
            result: 'Handler failed. fnName="fn name" serviceId="service" error: Error: some error',
        });
    });

    describe('Service handler tests', () => {
        it('Should register service function', async () => {
            // arrange
            const handler = new CallServiceHandler();
            handler.on('service', 'function', async (args) => {
                return { called: args };
            });

            // act
            const res = await handler.execute({
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

        it('Should UNregister service function', async () => {
            // arrange
            const handler = new CallServiceHandler();
            const unreg = handler.on('service', 'function', async (args) => {
                return { called: args };
            });
            unreg();

            // act
            const res = await handler.execute({
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
                handler.onEvent('service', 'function', async (args) => {
                    resolve({ called: args });
                });
            });
            handler.on('service', 'function', async (args) => {
                return { called: args };
            });

            // act
            const res = await handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function',
                args: ['hello', 'world'],
            });

            // assert
            await expect(returnPromise).resolves.toMatchObject({ called: ['hello', 'world'] });
        });

        it('Should UNregister event', async () => {
            // arrange
            const handler = new CallServiceHandler();
            const unreg = handler.onEvent('service', 'function', async (args) => {
                // don't care
            });
            unreg();

            // act
            const res = await handler.execute({
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

        it('Should register multiple service functions', async () => {
            // arrange
            const handler = new CallServiceHandler();
            handler.on('service', 'function1', async (args) => {
                return 'called function1';
            });
            handler.on('service', 'function2', async (args) => {
                return 'called function2';
            });

            // act
            const res1 = await handler.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function1',
            });
            const res2 = await handler.execute({
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

        it('Should override previous function registration', async () => {
            // arrange
            const handler = new CallServiceHandler();
            handler.on('service', 'function', async (args) => {
                return { called: args };
            });
            handler.on('service', 'function', async (args) => {
                return 'overridden';
            });

            // act
            const res = await handler.execute({
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
        it('Should work with NON overlapping function registration', async () => {
            // arrange
            const base = new CallServiceHandler();
            base.on('service', 'function1', async (args) => {
                return 'called function1';
            });
            const another = new CallServiceHandler();
            base.on('service', 'function2', async (args) => {
                return 'called function2';
            });

            base.combineWith(another);

            // act
            const res1 = await base.execute({
                ...req(),
                serviceId: 'service',
                fnName: 'function1',
            });
            const res2 = await base.execute({
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

        it('Should work with overlapping function registration', async () => {
            // arrange
            const base = new CallServiceHandler();
            base.on('service', 'function', async (args) => {
                return { called: args };
            });
            const another = new CallServiceHandler();
            another.on('service', 'function', async (args) => {
                return 'overridden';
            });

            base.combineWith(another);

            // act
            const res = await base.execute({
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
