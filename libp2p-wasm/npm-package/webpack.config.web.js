// Generated using webpack-cli https://github.com/webpack/webpack-cli

const config = require('./webpack.config.js');

module.exports = () => {
    const cfg = config({
        NODE: true,
        WEB: false,
    });
    cfg.output.filename = 'libp2p-wasm.web.js';
    cfg.target = 'web';
    return cfg;
};
