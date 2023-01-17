// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const ReplacePlugin = require('webpack-plugin-replace');

const mode = 'production';

const config = () => ({
    mode: mode,
    entry: './src/index.ts',
    output: {
        path: path.resolve('dist'),
    },
    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/i,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
                exclude: ['/node_modules/'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new ReplacePlugin({
            values: {
                __marine__: '10',
                __avm__: '20',
            },
        }),
    ],
});

module.exports = () => {
    return config();
};
