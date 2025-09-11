/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';
import assert from 'assert';

import {withBrowser} from '../utils.js';
import {consoleTool} from '../../src/tools/console.js';

describe('console', () => {
  describe('list_console_messages', () => {
    it('list messages', async () => {
      await withBrowser(async (response, context) => {
        await consoleTool.handler({params: {}}, response, context);
        assert.ok(response.includeConsoleData);
      });
    });
  });
});
