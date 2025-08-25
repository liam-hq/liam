import {
  SemanticInternalAttributes,
  SpanStatusCode,
  clock,
  context,
  init_esm as init_esm2,
  isCompleteTaskWithOutput,
  propagation,
  recordSpanException,
  require_src3 as require_src,
  taskContext,
  trace,
  usage
} from "./chunk-RV2AOCDC.mjs";
import {
  __toESM,
  init_esm
} from "./chunk-UGJZ2EIQ.mjs";

// ../../../node_modules/.pnpm/@trigger.dev+core@4.0.0-v4-beta.21_supports-color@10.0.0/node_modules/@trigger.dev/core/dist/esm/v3/tracer.js
init_esm();
init_esm2();
var import_api_logs = __toESM(require_src(), 1);
var TriggerTracer = class {
  _config;
  constructor(_config) {
    this._config = _config;
  }
  _tracer;
  get tracer() {
    if (!this._tracer) {
      if ("tracer" in this._config)
        return this._config.tracer;
      this._tracer = trace.getTracer(this._config.name, this._config.version);
    }
    return this._tracer;
  }
  _logger;
  get logger() {
    if (!this._logger) {
      if ("logger" in this._config)
        return this._config.logger;
      this._logger = import_api_logs.logs.getLogger(this._config.name, this._config.version);
    }
    return this._logger;
  }
  extractContext(traceContext) {
    return propagation.extract(context.active(), traceContext ?? {});
  }
  startActiveSpan(name, fn, options, ctx, signal) {
    const parentContext = ctx ?? context.active();
    const attributes = options?.attributes ?? {};
    let spanEnded = false;
    const createPartialSpanWithEvents = options?.events && options.events.length > 0;
    return this.tracer.startActiveSpan(name, {
      ...options,
      attributes: {
        ...attributes,
        ...createPartialSpanWithEvents ? {
          [SemanticInternalAttributes.SKIP_SPAN_PARTIAL]: true
        } : {}
      },
      startTime: clock.preciseNow()
    }, parentContext, async (span) => {
      signal?.addEventListener("abort", () => {
        if (!spanEnded) {
          spanEnded = true;
          recordSpanException(span, signal.reason);
          span.end();
        }
      });
      if (taskContext.ctx && createPartialSpanWithEvents) {
        const partialSpan = this.tracer.startSpan(name, {
          ...options,
          attributes: {
            ...attributes,
            [SemanticInternalAttributes.SPAN_PARTIAL]: true,
            [SemanticInternalAttributes.SPAN_ID]: span.spanContext().spanId
          }
        }, parentContext);
        if (options?.events) {
          for (const event of options.events) {
            partialSpan.addEvent(event.name, event.attributes, event.startTime);
          }
        }
        partialSpan.end();
      }
      if (options?.events) {
        for (const event of options.events) {
          span.addEvent(event.name, event.attributes, event.startTime);
        }
      }
      const usageMeasurement = usage.start();
      try {
        return await fn(span);
      } catch (e) {
        if (isCompleteTaskWithOutput(e)) {
          if (!spanEnded) {
            span.end(clock.preciseNow());
          }
          throw e;
        }
        if (!spanEnded) {
          if (typeof e === "string" || e instanceof Error) {
            span.recordException(e);
          }
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
        throw e;
      } finally {
        if (!spanEnded) {
          spanEnded = true;
          if (taskContext.ctx) {
            const usageSample = usage.stop(usageMeasurement);
            const machine = taskContext.ctx.machine;
            span.setAttributes({
              [SemanticInternalAttributes.USAGE_DURATION_MS]: usageSample.cpuTime,
              [SemanticInternalAttributes.USAGE_COST_IN_CENTS]: machine?.centsPerMs ? usageSample.cpuTime * machine.centsPerMs : 0
            });
          }
          span.end(clock.preciseNow());
        }
      }
    });
  }
  startSpan(name, options, ctx) {
    const parentContext = ctx ?? context.active();
    const attributes = options?.attributes ?? {};
    const span = this.tracer.startSpan(name, options, parentContext);
    return span;
  }
};

export {
  TriggerTracer
};
//# sourceMappingURL=chunk-PEBYEH3K.mjs.map
