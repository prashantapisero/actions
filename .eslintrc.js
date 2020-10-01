module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'import', 'unused-imports', 'jsdoc'],
  ignorePatterns: ['node_modules/', '*.snap'],
  extends: [
    'airbnb/base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jsdoc/recommended',
    'plugin:prettier/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  rules: {
    camelcase: 'off',
    'import/extensions': 'off',
    'import/order': [
      'error',
      {
        alphabetize: { caseInsensitive: true, order: 'asc' },
        groups: [
          ['external', 'builtin'],
          ['internal', 'index', 'sibling', 'parent'],
        ],
        'newlines-between': 'always',
      },
    ],
    'jsdoc/check-tag-names': 'off',
    'jsdoc/empty-tags': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-type': 'off',
    'no-console': ['error', { allow: ['error'] }],
    'no-underscore-dangle': 'off',
    'object-curly-spacing': ['error', 'always'],
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-imports-ts': 'error',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'func-names': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'no-console': 'error',
    'no-empty': 'off',
    quotes: [2, 'single', { avoidEscape: true }],
    'max-len': [
      'error',
      {
        code: 250,
        ignoreStrings: true,
        ignoreUrls: true,
        tabWidth: 2,
      },
    ],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@sr-actions', './src/actions'],
          ['@sr-services', './src/services'],
          ['@sr-triggers', './src/triggers'],
        ],
        extensions: ['.ts', '.js', '.json'],
      },
    },
  },
}
