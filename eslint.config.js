import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: [
      'dist',
      'coverage',
      '.vite',
      'eslint.config.js',
      'scripts/buildIconMap.js',
      'scripts/lib/testPlatformIcon.js'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        project: true,
        tsConfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'prefer-const': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/self-closing-comp': 'error',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {
          ignoreVoidOperator: true,
          ignoreVoidReturningFunctions: true
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    files: ['vite.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    rules: { 'no-undef': 'off' }
  },
  eslintConfigPrettier
)
