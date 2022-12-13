// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');

// const isProduction = true;
// uncomment to debug
const isProduction = false;

const config = () => ({
    entry: './src/index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve('dist'),
    },
    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/i,
                use: [
                    // force new line
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
        fallback: {
            path: false,
            fs: false,
        },
    },
});

module.exports = () => {
    const res = config();
    if (isProduction) {
        res.mode = 'production';
    } else {
        res.mode = 'development';
    }

    return res;
};
