/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig, globalIgnores} from 'eslint/config';
import checkLicensePlugin from './scripts/eslint_rules/check-license-plugin.js';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/build/']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {js},
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {globals: globals.node},
  },
  {plugins: {checkLicensePlugin}},
  {
    rules: {
      'checkLicensePlugin/check-license': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': [
        'error',
        {
          ignoreRestArgs: true,
        },
      ],
    },
  },
  tseslint.configs.recommended,
]);
