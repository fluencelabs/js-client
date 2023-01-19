// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const webpack = require('webpack');
const ReplacePlugin = require('webpack-plugin-replace');

// const mode = 'production';
const mode = 'development';

const config = {
    mode: mode,
    entry: './dist/index.js',
    output: {
        path: path.resolve('dist'),
    },
    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            buffer: require.resolve('buffer/'),
        },
    },
    plugins: [
        // new ReplacePlugin({
        //     values: {
        //         __marine__: '__marine__10',
        //         __avm__: '__avm__10',
        //     },
        // }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
};

module.exports = () => {
    return config;
};
