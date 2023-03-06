import handler from 'serve-handler';
import { createServer } from 'http';
import type { Server } from 'http';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CDN_PORT = 8765;
const CDN_PUBLIC_PATH = join(__dirname, '../../../client/js-client.web.standalone/dist/');

export const startCdn = () => startContentServer(CDN_PORT, CDN_PUBLIC_PATH);

export const startContentServer = (port: number, publicDir: string): Server => {
    const server = createServer((request, response) => {
        return handler(request, response, {
            public: publicDir,
        });
    });

    console.log(publicDir);

    return server.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
};

export const stopServer = (app: Server): void => {
    app.close(() => {
        console.log('Server stopped');
    });
};
