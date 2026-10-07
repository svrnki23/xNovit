// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const NOT_DETERMINISTIC =
  'packages/core must be deterministic: pass the current time and any ids in as inputs.';
const NO_IO =
  'packages/core must stay free of network, file, and database I/O: inject a provider instead.';

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/dist/', '**/coverage/', 'xNovit/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Section 3 of the build brief: core is pure TypeScript with no I/O, and
    // section 5 requires the same inputs to always produce identical output.
    files: ['packages/core/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: '^(node:|fs|path|http|https|net|child_process|@supabase/)', message: NO_IO },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: NO_IO },
        { name: 'process', message: NO_IO },
        { name: 'crypto', message: NOT_DETERMINISTIC },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: NOT_DETERMINISTIC },
        { object: 'Date', property: 'now', message: NOT_DETERMINISTIC },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: NOT_DETERMINISTIC,
        },
      ],
    },
  },
  prettier,
]);
