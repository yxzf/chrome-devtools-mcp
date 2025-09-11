/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it, afterEach} from 'node:test';
import assert from 'assert';
import sinon from 'sinon';

import {startTrace, stopTrace} from '../../src/tools/performance.js';
import {withBrowser} from '../utils.js';
import {loadTraceAsBuffer} from '../trace-processing/fixtures/load.js';

describe('performance', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('performance_start_trace', () => {
    it('starts a trace recording', async () => {
      await withBrowser(async (response, context) => {
        context.setIsRunningPerformanceTrace(false);
        const selectedPage = await context.getSelectedPage();
        const startTracingStub = sinon.stub(selectedPage.tracing, 'start');
        await startTrace.handler(
          {params: {reload: true, autoStop: false}},
          response,
          context,
        );
        sinon.assert.calledOnce(startTracingStub);
        assert.ok(context.isRunningPerformanceTrace());
        assert.ok(
          response.responseLines
            .join('\n')
            .match(/The performance trace is being recorded/),
        );
      });
    });

    it('can navigate to about:blank and record a page reload', async () => {
      await withBrowser(async (response, context) => {
        const selectedPage = await context.getSelectedPage();
        sinon.stub(selectedPage, 'url').callsFake(() => 'https://www.test.com');
        const gotoStub = sinon.stub(selectedPage, 'goto');
        const startTracingStub = sinon.stub(selectedPage.tracing, 'start');
        await startTrace.handler(
          {params: {reload: true, autoStop: false}},
          response,
          context,
        );
        sinon.assert.calledOnce(startTracingStub);
        sinon.assert.calledWithExactly(gotoStub, 'about:blank', {
          waitUntil: ['networkidle0'],
        });
        sinon.assert.calledWithExactly(gotoStub, 'https://www.test.com', {
          waitUntil: ['load'],
        });
        assert.ok(context.isRunningPerformanceTrace());
        assert.ok(
          response.responseLines
            .join('\n')
            .match(/The performance trace is being recorded/),
        );
      });
    });

    it('can autostop a recording', async () => {
      const rawData = loadTraceAsBuffer('basic-trace.json.gz');

      await withBrowser(async (response, context) => {
        const selectedPage = await context.getSelectedPage();
        sinon.stub(selectedPage, 'url').callsFake(() => 'https://www.test.com');
        sinon.stub(selectedPage, 'goto').callsFake(() => Promise.resolve(null));
        const startTracingStub = sinon.stub(selectedPage.tracing, 'start');
        const stopTracingStub = sinon
          .stub(selectedPage.tracing, 'stop')
          .callsFake(async () => {
            return rawData;
          });

        const clock = sinon.useFakeTimers();
        const handlerPromise = startTrace.handler(
          {params: {reload: true, autoStop: true}},
          response,
          context,
        );
        // In the handler we wait 5 seconds after the page load event (which is
        // what DevTools does), hence we now fake-progress time to allow
        // the handler to complete. We allow extra time because the Trace
        // Engine also uses some timers to yield updates and we need those to
        // execute.
        await clock.tickAsync(6_000);
        await handlerPromise;
        clock.restore();

        sinon.assert.calledOnce(startTracingStub);
        sinon.assert.calledOnce(stopTracingStub);
        assert.strictEqual(
          context.isRunningPerformanceTrace(),
          false,
          'Tracing was stopped',
        );
        assert.ok(
          response.responseLines
            .join('\n')
            .match(/The performance trace has been stopped/),
        );
      });
    });

    it('errors if a recording is already active', async () => {
      await withBrowser(async (response, context) => {
        context.setIsRunningPerformanceTrace(true);
        const selectedPage = await context.getSelectedPage();
        const startTracingStub = sinon.stub(selectedPage.tracing, 'start');
        await startTrace.handler(
          {params: {reload: true, autoStop: false}},
          response,
          context,
        );
        sinon.assert.notCalled(startTracingStub);
        assert.ok(
          response.responseLines
            .join('\n')
            .match(/a performance trace is already running/),
        );
      });
    });
  });

  describe('performance_stop_trace', () => {
    it('does nothing if the trace is not running and does not error', async () => {
      await withBrowser(async (response, context) => {
        context.setIsRunningPerformanceTrace(false);
        await stopTrace.handler({params: {}}, response, context);
      });
    });

    it('will stop the trace and return trace info when a trace is running', async () => {
      const rawData = loadTraceAsBuffer('basic-trace.json.gz');
      await withBrowser(async (response, context) => {
        context.setIsRunningPerformanceTrace(true);
        const selectedPage = await context.getSelectedPage();
        const stopTracingStub = sinon
          .stub(selectedPage.tracing, 'stop')
          .callsFake(async () => {
            return rawData;
          });
        await stopTrace.handler({params: {}}, response, context);
        assert.ok(
          response.responseLines.includes(
            'The performance trace has been stopped.',
          ),
        );
        sinon.assert.calledOnce(stopTracingStub);
      });
    });
  });
});
