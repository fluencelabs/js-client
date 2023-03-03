import express from 'express';
import type { Server } from 'http';

const CDN_PORT = 8765;
const CDN_PUBLIC_PATH = '../../packages/client/js-client.web.standalone/dist';

export const startCdn = () => startContentServer(CDN_PORT, CDN_PUBLIC_PATH);

export const startContentServer = (port: number, publicDir: string): Server => {
    const app = express();

    app.use(express.static(publicDir));

    return app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
};

export const stopServer = (app: Server): void => {
    app.close(() => {
        console.log('Server stopped');
    });
};
