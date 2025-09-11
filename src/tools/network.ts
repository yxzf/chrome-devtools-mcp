/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import z from 'zod';
import {defineTool} from './ToolDefinition.js';
import {ToolCategories} from './categories.js';

export const listNetworkRequests = defineTool({
  name: 'list_network_requests',
  description: `List all requests for the currently selected page`,
  annotations: {
    category: ToolCategories.NETWORK,
    readOnlyHint: true,
  },
  schema: {},
  handler: async (_request, response) => {
    response.setIncludeNetworkRequests(true);
  },
});

export const getNetworkRequest = defineTool({
  name: 'get_network_request',
  description: `Gets a network request by URL. You can get all requests by calling ${listNetworkRequests.name}.`,
  annotations: {
    category: ToolCategories.NETWORK,
    readOnlyHint: true,
  },
  schema: {
    url: z.string().describe('The URL of the request.'),
  },
  handler: async (request, response, _context) => {
    response.attachNetworkRequest(request.params.url);
    response.setIncludeNetworkRequests(true);
  },
});
