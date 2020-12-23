module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module', // Allows for the use of imports
    },
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
        'plugin:prettier/recommended',
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    rules: {},
    settings: {
        'import/extensions': ['.js', '.ts'],
    },
};
