// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');

// const isProduction = true;
// uncomment to debug
const isProduction = false;

const config = () => ({
    entry: './src/index.ts',
    output: {
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
                        options: {
                            compilerOptions: {
                                declaration: false,
                            },
                        },
                    },
                ],
                exclude: ['/node_modules/'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
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