module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 13,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'simple-import-sort'],
    rules: {
        indent: ['off'],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
        semi: ['error', 'always'],
        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': ['off'],
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
    },
};
