import handler from 'serve-handler';
import { createServer } from 'http';
import type { Server } from 'http';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CDN_PUBLIC_PATH = join(__dirname, '../../../core/js-client/dist/browser');

export const startCdn = (port: number) => startContentServer(port, CDN_PUBLIC_PATH);

export const startContentServer = (port: number, publicDir: string): Promise<Server> => {
    const server = createServer((request, response) => {
        return handler(request, response, {
            public: publicDir,
            rewrites: [{
                source: '/js-client.min.js',
                destination: '/source/index.umd.cjs'
            }],
            headers: [{
                source: '**/*',
                headers: [
                    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                    { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }
                ]
            }]
        });
    });

    return new Promise<Server>((resolve) => {
        const result = server.listen(port, () => {
            console.log(`server started on port ${port}`);
            console.log(`public dir ${publicDir}`);
            resolve(result);
        });
    });
};

export const stopServer = (app: Server): Promise<void> => {
    return new Promise<void>((resolve) => {
        app.close(() => {
            console.log('server stopped');
            resolve();
        });
    });
};
