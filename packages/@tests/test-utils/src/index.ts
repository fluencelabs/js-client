import handler from 'serve-handler';
import { createServer } from 'http';
import type { Server } from 'http';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CDN_PUBLIC_PATH = join(__dirname, '../../../client/js-client.web.standalone/dist/');

export const startCdn = (port: number) => startContentServer(port, CDN_PUBLIC_PATH);

export const startContentServer = (port: number, publicDir: string): Promise<Server> => {
    const server = createServer((request, response) => {
        return handler(request, response, {
            public: publicDir,
        });
    });

    console.log(publicDir);

    return new Promise<Server>((resolve) => {
        const result = server.listen(port, () => {
            console.log(`Server started on port ${port}`);
            resolve(result);
        });
    });
};

export const stopServer = (app: Server): Promise<void> => {
    return new Promise<void>((resolve) => {
        app.close(() => {
            console.log('Server stopped');
            resolve();
        });
    });
};
