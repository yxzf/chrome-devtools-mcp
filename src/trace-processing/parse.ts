/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {PerformanceInsightFormatter} from '../../node_modules/chrome-devtools-frontend/front_end/models/ai_assistance/data_formatters/PerformanceInsightFormatter.js';
import * as TraceEngine from '../../node_modules/chrome-devtools-frontend/front_end/models/trace/trace.js';
import {logger} from '../logger.js';

const engine = TraceEngine.TraceModel.Model.createWithAllHandlers();

export interface TraceResult {
  parsedTrace: TraceEngine.TraceModel.ParsedTrace;
  insights: TraceEngine.Insights.Types.TraceInsightSets;
}

export async function parseRawTraceBuffer(
  buffer: Uint8Array<ArrayBufferLike> | undefined,
): Promise<TraceResult | null> {
  engine.resetProcessor();
  if (!buffer) {
    return null;
  }
  const asString = new TextDecoder().decode(buffer);
  if (!asString) {
    return null;
  }
  try {
    const data = JSON.parse(asString) as
      | {
          traceEvents: TraceEngine.Types.Events.Event[];
        }
      | TraceEngine.Types.Events.Event[];

    const events = Array.isArray(data) ? data : data.traceEvents;
    await engine.parse(events);
    const parsedTrace = engine.parsedTrace();
    if (!parsedTrace) {
      return null;
    }

    const insights = parsedTrace?.insights;
    if (!insights) {
      return null;
    }

    return {
      parsedTrace,
      insights,
    };
  } catch (e) {
    if (e instanceof Error) {
      logger(`Error parsing trace: ${e.message}`);
    } else {
      logger(`Error parsing trace: ${JSON.stringify(e)}`);
    }
    return null;
  }
}

// TODO(jactkfranklin): move the formatters from DevTools to use here.
// This is a very temporary helper to output some text from the tool call to aid development.
export function insightOutput(result: TraceResult): string {
  const mainNavigationId =
    result.parsedTrace.data.Meta.mainFrameNavigations.at(0)?.args.data
      ?.navigationId;
  if (!mainNavigationId) {
    return '';
  }

  let text = '';
  const insightsForNav = result.insights.get(mainNavigationId);
  if (!insightsForNav) {
    text += 'No Performance insights were found for this trace.';
    return text;
  }

  const failingInsightKeys = Object.keys(insightsForNav.model).filter(
    insightKey => {
      const key = insightKey as keyof TraceEngine.Insights.Types.InsightModels;
      const data = insightsForNav.model[key] ?? null;
      return data?.state === 'fail';
    },
  ) as Array<keyof TraceEngine.Insights.Types.InsightModels>;
  logger(`Found failing Insight keys: ${failingInsightKeys.join(', ')}`);

  for (const failingKey of failingInsightKeys) {
    const modelData = insightsForNav.model[failingKey];
    const formatter = new PerformanceInsightFormatter(
      result.parsedTrace,
      modelData,
    );

    const output = formatter.formatInsight();
    text += `${output}\n`;
  }
  return text;
}
