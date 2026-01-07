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
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error'],
    },
  },

  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.esm.json',
        tsconfigRootDir: import.meta.dirname || process.cwd(),
      },
    },
  }
);
