import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,js}'],
    plugins: { js },
    extends: ['js/recommended', eslintPluginPrettierRecommended],
    languageOptions: { globals: globals.node, ecmaVersion: 2023 },
    rules: {
      ...tseslint.configs.recommended,
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
]);
