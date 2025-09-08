module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: ['eslint:recommended', 'plugin:vue/recommended', 'prettier'],
  parser: 'vue-eslint-parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['vue'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'vue/multi-word-component-names': 'off',
  },
};
