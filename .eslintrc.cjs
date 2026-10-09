module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: 'detect' } },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  overrides: [
    {
      files: ['src/**/*.test.{js,jsx}', 'jest.setup.js'],
      env: { jest: true },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/', 'playwright-report/', 'test-results/'],
};
