import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.turbo/**']
  },
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended
);
