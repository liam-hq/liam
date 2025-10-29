/**
 * Runtime state for batch progress tracking and concurrency control
 * Uses in-memory maps keyed by batchId to track progress across parallel executions
 */

type ProgressState = {
  completed: number
  total: number
}

type Semaphore = {
  count: number
  limit: number
  queue: Array<() => void>
}

const progressCounters = new Map<string, ProgressState>()
const semaphores = new Map<string, Semaphore>()

const CONCURRENT_TESTCASE_LIMIT = 3

/**
 * Initialize batch tracking with total count
 */
export function initBatch(batchId: string, total: number): void {
  progressCounters.set(batchId, { completed: 0, total })
  semaphores.set(batchId, {
    count: 0,
    limit: CONCURRENT_TESTCASE_LIMIT,
    queue: [],
  })
}

/**
 * Acquire semaphore for concurrent execution limiting
 * Returns immediately if semaphore not found (graceful degradation)
 */
export async function acquireSemaphore(batchId: string): Promise<void> {
  const semaphore = semaphores.get(batchId)
  if (!semaphore) {
    return
  }

  if (semaphore.count < semaphore.limit) {
    semaphore.count++
    return
  }

  await new Promise<void>((resolve) => {
    semaphore.queue.push(resolve)
  })
}

/**
 * Release semaphore after execution
 */
export function releaseSemaphore(batchId: string): void {
  const semaphore = semaphores.get(batchId)
  if (!semaphore) {
    return
  }

  const next = semaphore.queue.shift()
  if (next) {
    next()
  } else {
    semaphore.count--
  }
}

/**
 * Increment completed counter and return current progress
 */
export function incrementCompleted(batchId: string): ProgressState | null {
  const state = progressCounters.get(batchId)
  if (!state) {
    return null
  }

  state.completed++
  return { ...state }
}

/**
 * Clear batch tracking to prevent memory leaks
 */
export function clearBatch(batchId: string): void {
  progressCounters.delete(batchId)
  semaphores.delete(batchId)
}
