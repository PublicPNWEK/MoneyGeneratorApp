module.exports = {
  env: { node: true, es2022: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    'no-unused-vars': ['error', { vars: 'all', varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    'no-constant-condition': ['error', { checkLoops: false }],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
};
