# Test Execution Configuration

This document describes the configuration options for controlling test execution behavior in the QA agent.

## Environment Variables

### `TEST_MAX_CONCURRENCY`
- **Description**: Maximum number of concurrent test executions
- **Default**: `3`
- **Range**: 1-10 recommended
- **Impact**: Lower values reduce memory usage but increase execution time

### `TEST_TIMEOUT_MS`
- **Description**: Timeout for individual test execution in milliseconds
- **Default**: `30000` (30 seconds)
- **Range**: 5000-120000 recommended
- **Impact**: Prevents runaway tests from blocking the system

### `PGLITE_INITIAL_MEMORY_MB`
- **Description**: Initial memory allocation per PGlite instance in megabytes
- **Default**: `64` MB (reduced from 2GB to prevent memory spikes)
- **Range**: 32-256 MB recommended
- **Impact**: Lower values prevent memory exhaustion with concurrent instances

## Usage Examples

### Setting via environment variables:
```bash
export TEST_MAX_CONCURRENCY=2
export TEST_TIMEOUT_MS=60000
export PGLITE_INITIAL_MEMORY_MB=32
```

### Memory Usage Calculation
With default settings:
- Max concurrent tests: 3
- Memory per instance: 64MB
- Maximum memory usage: ~192MB (plus overhead)

## Architecture Details

### Concurrency Control
The system uses `p-limit` to enforce bounded concurrency, ensuring that no more than `TEST_MAX_CONCURRENCY` tests run simultaneously. This prevents memory exhaustion and system instability.

### Timeout Mechanism
Each test execution has an individual timeout controlled by `TEST_TIMEOUT_MS`. When a timeout occurs:
1. The test's AbortSignal is triggered
2. The PGlite instance is immediately closed
3. The test is marked as failed with a timeout error

### Abort Signal Propagation
The abort signal flows through the following chain:
1. `runTestTool` creates parent AbortController
2. `executeTestcase` receives and checks signal
3. `executeQuery` propagates signal to PGliteInstanceManager
4. `PGliteInstanceManager` closes database on abort

### Resource Cleanup
Resources are cleaned up in the following scenarios:
- Normal completion: Database closed after query execution
- Timeout: Database closed via abort handler
- Error: Database closed in finally block

## Performance Tuning

### For High-Memory Systems
```bash
export TEST_MAX_CONCURRENCY=6
export PGLITE_INITIAL_MEMORY_MB=128
```

### For Low-Memory Systems
```bash
export TEST_MAX_CONCURRENCY=1
export PGLITE_INITIAL_MEMORY_MB=32
```

### For Fast Feedback
```bash
export TEST_MAX_CONCURRENCY=4
export TEST_TIMEOUT_MS=15000
```