/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @type {import('prettier').Config}
 */
module.exports = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ...require('gts/.prettierrc.json'),
  singleAttributePerLine: true,
  htmlWhitespaceSensitivity: 'strict',
};
