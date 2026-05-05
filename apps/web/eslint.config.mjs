import rootConfig from '../../eslint.config.mjs';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import pluginQuery from '@tanstack/eslint-plugin-query';
import tseslint from 'typescript-eslint';

export default tseslint.config(...rootConfig, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: ['./tsconfig.app.json', './tsconfig.node.json'],
      tsconfigRootDir: import.meta.dirname
    },
    globals: {
      ...globals.browser
    }
  },
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    '@tanstack/query': pluginQuery
  },
  rules: {
    ...reactHooksPlugin.configs.recommended.rules,
    ...pluginQuery.configs.recommended.rules
    // Add any specific rules for Vite, React, or Zustand here
  }
});
