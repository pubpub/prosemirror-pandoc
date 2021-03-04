module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended",
    ],
    "plugins": [
        "@typescript-eslint",
        "prettier"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module",
        "project": './tsconfig.json'
    },
    "rules": {
        "@typescript-eslint/ban-ts-ignore": 0,
        "@typescript-eslint/camelcase": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/indent": 0,
        "@typescript-eslint/no-empty-interface": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-inferrable-types": 0,
        "@typescript-eslint/no-use-before-define": 0,
        "no-constant-condition": 0,
        "prettier/prettier": "error",
    },
};