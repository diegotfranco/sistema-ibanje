import rootConfig from '../../eslint.config.mjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(...rootConfig, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: ['./tsconfig.eslint.json'],
      tsconfigRootDir: import.meta.dirname
    },
    globals: {
      ...globals.node
    }
  }
});
