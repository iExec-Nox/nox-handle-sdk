import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  unicorn.configs.recommended,
  prettier,
  {
    rules: {
      'no-console': 'error',
      'unicorn/filename-case': 'off',
    },
  }
);
