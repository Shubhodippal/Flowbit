module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    "cypress/globals": true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'react-hooks',
    'cypress'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'cypress/videos/',
    'cypress/screenshots/'
  ],
  overrides: [
    {
      files: ['cypress/**/*.js'],
      plugins: ['cypress'],
      env: {
        'cypress/globals': true
      },
      rules: {
        'cypress/no-assigning-return-values': 'error',
        'cypress/no-unnecessary-waiting': 'error',
        'cypress/assertion-before-screenshot': 'warn'
      }
    },
    {
      files: ['**/seed.js', '**/server.js', '**/services/*.js', '**/contexts/*.js', '**/routes/webhooks.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
