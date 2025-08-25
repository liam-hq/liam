import {
  TriggerTracer
} from "./chunk-PEBYEH3K.mjs";
import {
  SemanticInternalAttributes,
  SpanKind,
  TaskRunPromise,
  accessoryAttributes,
  apiClientManager,
  conditionallyImportPacket,
  createErrorTaskError,
  defaultRetryOptions,
  flattenIdempotencyKey,
  getEnvVar,
  init_esm as init_esm2,
  lifecycleHooks,
  makeIdempotencyKey,
  mergeRequestOptions,
  parsePacket,
  resourceCatalog,
  runMetadata,
  runtime,
  stringifyIO,
  taskContext,
  timeout
} from "./chunk-RV2AOCDC.mjs";
import {
  init_esm
} from "./chunk-UGJZ2EIQ.mjs";

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/config.js
init_esm();
function defineConfig(config) {
  return config;
}

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/tasks.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/hooks.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/shared.js
init_esm();
init_esm2();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/runs.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/tracer.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/version.js
init_esm();
var VERSION = "4.0.0-v4-beta.21";

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/tracer.js
var tracer = new TriggerTracer({ name: "@trigger.dev/sdk", version: VERSION });

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/shared.js
function createTask(params) {
  const task2 = {
    id: params.id,
    description: params.description,
    trigger: async (payload, options) => {
      return await trigger_internal("trigger()", params.id, payload, void 0, {
        queue: params.queue?.name,
        ...options
      });
    },
    batchTrigger: async (items, options) => {
      return await batchTrigger_internal("batchTrigger()", params.id, items, options, void 0, void 0, params.queue?.name);
    },
    triggerAndWait: (payload, options) => {
      return new TaskRunPromise((resolve, reject) => {
        triggerAndWait_internal("triggerAndWait()", params.id, payload, void 0, {
          queue: params.queue?.name,
          ...options
        }).then((result) => {
          resolve(result);
        }).catch((error) => {
          reject(error);
        });
      }, params.id);
    },
    batchTriggerAndWait: async (items, options) => {
      return await batchTriggerAndWait_internal("batchTriggerAndWait()", params.id, items, void 0, options, void 0, params.queue?.name);
    }
  };
  registerTaskLifecycleHooks(params.id, params);
  resourceCatalog.registerTaskMetadata({
    id: params.id,
    description: params.description,
    queue: params.queue,
    retry: params.retry ? { ...defaultRetryOptions, ...params.retry } : void 0,
    machine: typeof params.machine === "string" ? { preset: params.machine } : params.machine,
    maxDuration: params.maxDuration,
    fns: {
      run: params.run
    }
  });
  const queue2 = params.queue;
  if (queue2 && typeof queue2.name === "string") {
    resourceCatalog.registerQueueMetadata({
      name: queue2.name,
      concurrencyLimit: queue2.concurrencyLimit,
      releaseConcurrencyOnWaitpoint: queue2.releaseConcurrencyOnWaitpoint
    });
  }
  task2[Symbol.for("trigger.dev/task")] = true;
  return task2;
}
async function trigger_internal(name2, id, payload, parsePayload, options, requestOptions) {
  const apiClient = apiClientManager.clientOrThrow();
  const parsedPayload = parsePayload ? await parsePayload(payload) : payload;
  const payloadPacket = await stringifyIO(parsedPayload);
  const handle = await apiClient.triggerTask(id, {
    payload: payloadPacket.data,
    options: {
      queue: options?.queue ? { name: options.queue } : void 0,
      concurrencyKey: options?.concurrencyKey,
      test: taskContext.ctx?.run.isTest,
      payloadType: payloadPacket.dataType,
      idempotencyKey: await makeIdempotencyKey(options?.idempotencyKey),
      idempotencyKeyTTL: options?.idempotencyKeyTTL,
      delay: options?.delay,
      ttl: options?.ttl,
      tags: options?.tags,
      maxAttempts: options?.maxAttempts,
      metadata: options?.metadata,
      maxDuration: options?.maxDuration,
      parentRunId: taskContext.ctx?.run.id,
      machine: options?.machine,
      priority: options?.priority,
      lockToVersion: options?.version ?? getEnvVar("TRIGGER_VERSION")
    }
  }, {
    spanParentAsLink: true
  }, {
    name: name2,
    tracer,
    icon: "trigger",
    onResponseBody: (body, span) => {
      if (body && typeof body === "object" && !Array.isArray(body)) {
        if ("id" in body && typeof body.id === "string") {
          span.setAttribute("runId", body.id);
        }
      }
    },
    ...requestOptions
  });
  return handle;
}
async function batchTrigger_internal(name2, taskIdentifier, items, options, parsePayload, requestOptions, queue2) {
  const apiClient = apiClientManager.clientOrThrow();
  const ctx = taskContext.ctx;
  const response = await apiClient.batchTriggerV3({
    items: await Promise.all(items.map(async (item, index) => {
      const parsedPayload = parsePayload ? await parsePayload(item.payload) : item.payload;
      const payloadPacket = await stringifyIO(parsedPayload);
      const batchItemIdempotencyKey = await makeIdempotencyKey(flattenIdempotencyKey([options?.idempotencyKey, `${index}`]));
      return {
        task: taskIdentifier,
        payload: payloadPacket.data,
        options: {
          queue: item.options?.queue ? { name: item.options.queue } : queue2 ? { name: queue2 } : void 0,
          concurrencyKey: item.options?.concurrencyKey,
          test: taskContext.ctx?.run.isTest,
          payloadType: payloadPacket.dataType,
          delay: item.options?.delay,
          ttl: item.options?.ttl,
          tags: item.options?.tags,
          maxAttempts: item.options?.maxAttempts,
          metadata: item.options?.metadata,
          maxDuration: item.options?.maxDuration,
          idempotencyKey: await makeIdempotencyKey(item.options?.idempotencyKey) ?? batchItemIdempotencyKey,
          idempotencyKeyTTL: item.options?.idempotencyKeyTTL ?? options?.idempotencyKeyTTL,
          machine: item.options?.machine,
          priority: item.options?.priority,
          lockToVersion: item.options?.version ?? getEnvVar("TRIGGER_VERSION")
        }
      };
    })),
    parentRunId: ctx?.run.id
  }, {
    spanParentAsLink: true,
    processingStrategy: options?.triggerSequentially ? "sequential" : void 0
  }, {
    name: name2,
    tracer,
    icon: "trigger",
    onResponseBody(body, span) {
      if (body && typeof body === "object" && !Array.isArray(body)) {
        if ("id" in body && typeof body.id === "string") {
          span.setAttribute("batchId", body.id);
        }
        if ("runCount" in body && Array.isArray(body.runCount)) {
          span.setAttribute("runCount", body.runCount);
        }
      }
    },
    ...requestOptions
  });
  const handle = {
    batchId: response.id,
    runCount: response.runCount,
    publicAccessToken: response.publicAccessToken
  };
  return handle;
}
async function triggerAndWait_internal(name2, id, payload, parsePayload, options, requestOptions) {
  const ctx = taskContext.ctx;
  if (!ctx) {
    throw new Error("triggerAndWait can only be used from inside a task.run()");
  }
  const apiClient = apiClientManager.clientOrThrow();
  const parsedPayload = parsePayload ? await parsePayload(payload) : payload;
  const payloadPacket = await stringifyIO(parsedPayload);
  return await tracer.startActiveSpan(name2, async (span) => {
    const response = await apiClient.triggerTask(id, {
      payload: payloadPacket.data,
      options: {
        dependentAttempt: ctx.attempt.id,
        lockToVersion: taskContext.worker?.version,
        // Lock to current version because we're waiting for it to finish
        queue: options?.queue ? { name: options.queue } : void 0,
        concurrencyKey: options?.concurrencyKey,
        test: taskContext.ctx?.run.isTest,
        payloadType: payloadPacket.dataType,
        delay: options?.delay,
        ttl: options?.ttl,
        tags: options?.tags,
        maxAttempts: options?.maxAttempts,
        metadata: options?.metadata,
        maxDuration: options?.maxDuration,
        resumeParentOnCompletion: true,
        parentRunId: ctx.run.id,
        idempotencyKey: await makeIdempotencyKey(options?.idempotencyKey),
        idempotencyKeyTTL: options?.idempotencyKeyTTL,
        machine: options?.machine,
        priority: options?.priority,
        releaseConcurrency: options?.releaseConcurrency
      }
    }, {}, requestOptions);
    span.setAttribute("runId", response.id);
    const result = await runtime.waitForTask({
      id: response.id,
      ctx
    });
    return await handleTaskRunExecutionResult(result, id);
  }, {
    kind: SpanKind.PRODUCER,
    attributes: {
      [SemanticInternalAttributes.STYLE_ICON]: "trigger",
      ...accessoryAttributes({
        items: [
          {
            text: id,
            variant: "normal"
          }
        ],
        style: "codepath"
      })
    }
  });
}
async function batchTriggerAndWait_internal(name2, id, items, parsePayload, options, requestOptions, queue2) {
  const ctx = taskContext.ctx;
  if (!ctx) {
    throw new Error("batchTriggerAndWait can only be used from inside a task.run()");
  }
  const apiClient = apiClientManager.clientOrThrow();
  return await tracer.startActiveSpan(name2, async (span) => {
    const response = await apiClient.batchTriggerV3({
      items: await Promise.all(items.map(async (item, index) => {
        const parsedPayload = parsePayload ? await parsePayload(item.payload) : item.payload;
        const payloadPacket = await stringifyIO(parsedPayload);
        const batchItemIdempotencyKey = await makeIdempotencyKey(flattenIdempotencyKey([options?.idempotencyKey, `${index}`]));
        return {
          task: id,
          payload: payloadPacket.data,
          options: {
            lockToVersion: taskContext.worker?.version,
            queue: item.options?.queue ? { name: item.options.queue } : queue2 ? { name: queue2 } : void 0,
            concurrencyKey: item.options?.concurrencyKey,
            test: taskContext.ctx?.run.isTest,
            payloadType: payloadPacket.dataType,
            delay: item.options?.delay,
            ttl: item.options?.ttl,
            tags: item.options?.tags,
            maxAttempts: item.options?.maxAttempts,
            metadata: item.options?.metadata,
            maxDuration: item.options?.maxDuration,
            idempotencyKey: await makeIdempotencyKey(item.options?.idempotencyKey) ?? batchItemIdempotencyKey,
            idempotencyKeyTTL: item.options?.idempotencyKeyTTL ?? options?.idempotencyKeyTTL,
            machine: item.options?.machine,
            priority: item.options?.priority
          }
        };
      })),
      resumeParentOnCompletion: true,
      parentRunId: ctx.run.id
    }, {
      processingStrategy: options?.triggerSequentially ? "sequential" : void 0
    }, requestOptions);
    span.setAttribute("batchId", response.id);
    span.setAttribute("runCount", response.runCount);
    const result = await runtime.waitForBatch({
      id: response.id,
      runCount: response.runCount,
      ctx
    });
    const runs2 = await handleBatchTaskRunExecutionResult(result.items, id);
    return {
      id: result.id,
      runs: runs2
    };
  }, {
    kind: SpanKind.PRODUCER,
    attributes: {
      [SemanticInternalAttributes.STYLE_ICON]: "trigger",
      ...accessoryAttributes({
        items: [
          {
            text: id,
            variant: "normal"
          }
        ],
        style: "codepath"
      })
    }
  });
}
async function handleBatchTaskRunExecutionResult(items, taskIdentifier) {
  const someObjectStoreOutputs = items.some((item) => item.ok && item.outputType === "application/store");
  if (!someObjectStoreOutputs) {
    const results = await Promise.all(items.map(async (item) => {
      return await handleTaskRunExecutionResult(item, taskIdentifier);
    }));
    return results;
  }
  return await tracer.startActiveSpan("store.downloadPayloads", async (span) => {
    const results = await Promise.all(items.map(async (item) => {
      return await handleTaskRunExecutionResult(item, taskIdentifier);
    }));
    return results;
  }, {
    kind: SpanKind.INTERNAL,
    [SemanticInternalAttributes.STYLE_ICON]: "cloud-download"
  });
}
async function handleTaskRunExecutionResult(execution, taskIdentifier) {
  if (execution.ok) {
    const outputPacket = { data: execution.output, dataType: execution.outputType };
    const importedPacket = await conditionallyImportPacket(outputPacket, tracer);
    return {
      ok: true,
      id: execution.id,
      taskIdentifier: execution.taskIdentifier ?? taskIdentifier,
      output: await parsePacket(importedPacket)
    };
  } else {
    return {
      ok: false,
      id: execution.id,
      taskIdentifier: execution.taskIdentifier ?? taskIdentifier,
      error: createErrorTaskError(execution.error)
    };
  }
}
function registerTaskLifecycleHooks(taskId, params) {
  if (params.init) {
    lifecycleHooks.registerTaskInitHook(taskId, {
      fn: params.init
    });
  }
  if (params.onStart) {
    lifecycleHooks.registerTaskStartHook(taskId, {
      fn: params.onStart
    });
  }
  if (params.onFailure) {
    lifecycleHooks.registerTaskFailureHook(taskId, {
      fn: params.onFailure
    });
  }
  if (params.onSuccess) {
    lifecycleHooks.registerTaskSuccessHook(taskId, {
      fn: params.onSuccess
    });
  }
  if (params.onComplete) {
    lifecycleHooks.registerTaskCompleteHook(taskId, {
      fn: params.onComplete
    });
  }
  if (params.onWait) {
    lifecycleHooks.registerTaskWaitHook(taskId, {
      fn: params.onWait
    });
  }
  if (params.onResume) {
    lifecycleHooks.registerTaskResumeHook(taskId, {
      fn: params.onResume
    });
  }
  if (params.catchError) {
    lifecycleHooks.registerTaskCatchErrorHook(taskId, {
      fn: params.catchError
    });
  }
  if (params.handleError) {
    lifecycleHooks.registerTaskCatchErrorHook(taskId, {
      fn: params.handleError
    });
  }
  if (params.middleware) {
    lifecycleHooks.registerTaskMiddlewareHook(taskId, {
      fn: params.middleware
    });
  }
  if (params.cleanup) {
    lifecycleHooks.registerTaskCleanupHook(taskId, {
      fn: params.cleanup
    });
  }
  if (params.onCancel) {
    lifecycleHooks.registerTaskCancelHook(taskId, {
      fn: params.onCancel
    });
  }
}

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/tasks.js
var task = createTask;

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/index.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/cache.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/retry.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/wait.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/batch.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/waitUntil.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/usage.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/idempotencyKeys.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/tags.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/metadata.js
init_esm();
var parentMetadataUpdater = runMetadata.parent;
var rootMetadataUpdater = runMetadata.root;
var metadataUpdater = {
  set: setMetadataKey,
  del: deleteMetadataKey,
  append: appendMetadataKey,
  remove: removeMetadataKey,
  increment: incrementMetadataKey,
  decrement: decrementMetadataKey,
  flush: flushMetadata
};
var metadata = {
  current: currentMetadata,
  get: getMetadataKey,
  save: saveMetadata,
  replace: replaceMetadata,
  stream,
  fetchStream,
  parent: parentMetadataUpdater,
  root: rootMetadataUpdater,
  refresh: refreshMetadata,
  ...metadataUpdater
};
function currentMetadata() {
  return runMetadata.current();
}
function getMetadataKey(key) {
  return runMetadata.getKey(key);
}
function setMetadataKey(key, value) {
  runMetadata.set(key, value);
  return metadataUpdater;
}
function deleteMetadataKey(key) {
  runMetadata.del(key);
  return metadataUpdater;
}
function replaceMetadata(metadata2) {
  runMetadata.update(metadata2);
}
function saveMetadata(metadata2) {
  runMetadata.update(metadata2);
}
function incrementMetadataKey(key, value = 1) {
  runMetadata.increment(key, value);
  return metadataUpdater;
}
function decrementMetadataKey(key, value = 1) {
  runMetadata.decrement(key, value);
  return metadataUpdater;
}
function appendMetadataKey(key, value) {
  runMetadata.append(key, value);
  return metadataUpdater;
}
function removeMetadataKey(key, value) {
  runMetadata.remove(key, value);
  return metadataUpdater;
}
async function flushMetadata(requestOptions) {
  const $requestOptions = mergeRequestOptions({
    tracer,
    name: "metadata.flush()",
    icon: "code-plus"
  }, requestOptions);
  await runMetadata.flush($requestOptions);
}
async function refreshMetadata(requestOptions) {
  const $requestOptions = mergeRequestOptions({
    tracer,
    name: "metadata.refresh()",
    icon: "code-plus"
  }, requestOptions);
  await runMetadata.refresh($requestOptions);
}
async function stream(key, value, signal) {
  return runMetadata.stream(key, value, signal);
}
async function fetchStream(key, signal) {
  return runMetadata.fetchStream(key, signal);
}

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/timeout.js
init_esm();
var MAXIMUM_MAX_DURATION = 2147483647;
var timeout2 = {
  None: MAXIMUM_MAX_DURATION,
  signal: timeout.signal
};

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/webhooks.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/imports/uncrypto.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/locals.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/schedules/index.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/envvars.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/queues.js
init_esm();

// ../../../node_modules/.pnpm/@trigger.dev+sdk@4.0.0-v4-beta.21_ai@4.3.16_react@19.1.0_zod@3.23.8__zod@3.23.8/node_modules/@trigger.dev/sdk/dist/esm/v3/auth.js
init_esm();

export {
  defineConfig,
  task
};
//# sourceMappingURL=chunk-VGZV3RXS.mjs.map
