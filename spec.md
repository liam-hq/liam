# Schema-Bench Benchmark Workspace Feature Specification

## Overview

Add benchmark workspace functionality to the schema-bench package to standardize and automate the evaluation process.
This feature enables unified management of input data, reference data, and output data, and automates score calculation.

## Feature Specifications

### 1. Workspace Initialization Script

**Purpose**: Build a workspace environment for benchmark evaluation

**Implementation Location**: scripts section in `frontend/internal-packages/schema-bench/package.json`

**Script Name**: `setup-workspace`

**Processing Content**:
1. Create relative path `./benchmark-workspace` directory
2. Create the following subdirectory structure:
   ```
   ./benchmark-workspace/
   ├── execution/
   │   ├── input/      # Input data (schemas to be processed)
   │   ├── reference/  # Reference data (reference schemas)
   │   └── output/     # External processing results (generated in step 1.5)
   └── evaluation/     # Evaluation results
   ```
3. Copy existing data within the schema-bench package to appropriate directories
   - Input data → `./benchmark-workspace/execution/input/`
   - Reference data → `./benchmark-workspace/execution/reference/`

**Data Format**:
- Input data: **TBD**
- Reference data: JSON files in `@liam-hq/db-structure/schema` format
- File naming convention: `./benchmark-workspace/execution/input/${case_id}.json` (e.g., `./benchmark-workspace/execution/input/case-001.json`, `./benchmark-workspace/execution/reference/case-001.json`)

### 2. External Processing (executed outside schema-bench package)

**Purpose**: Process input data to generate schemas for evaluation

**Execution Entity**: Another agent package or external tool

**Processing Content**:
- Read data from `./benchmark-workspace/execution/input/`
- Execute some processing (AI model, conversion tool, etc.)
- Output processing results to `./benchmark-workspace/execution/output/`

**Note**: This processing is outside the scope of the schema-bench package and is executed externally

### 3. Score Calculation Script

**Purpose**: Execute benchmark evaluation using data in the workspace and output results

**Implementation Location**: scripts section in `frontend/internal-packages/schema-bench/package.json`

**Script Name**: `run-benchmark`

**Processing Content**:
1. Load data from `./benchmark-workspace/execution/output/` and `./benchmark-workspace/execution/reference/`
2. Calculate scores using the existing `evaluate` function
3. Output evaluation results to `./benchmark-workspace/evaluation/`

**Output Data Format**:
```json
{
  "timestamp": "2025-06-25T11:07:52.000Z",
  "caseId": "case-001",
  "metrics": {
    "tableF1Score": 0.95,
    "tableAllCorrectRate": 0.8,
    "columnF1ScoreAverage": 0.92,
    "columnAllCorrectRateAverage": 0.75,
    "primaryKeyAccuracyAverage": 0.9,
    "constraintAccuracy": 0.85,
    "overallSchemaAccuracy": 1.0
  },
  "tableMapping": {
    "insurance_agent": "agent",
    "customer": "customer",
    "policy": "policy"
  },
  "columnMappings": {
    "insurance_agent": {
      "agent_id": "id",
      "name": "agent_name"
    }
  }
}
```

**Output File Name**: `./benchmark-workspace/evaluation/${case_id}_results_{timestamp}.json`

## Directory Structure

```
frontend/internal-packages/schema-bench/
├── package.json                     # Script definitions
├── src/
│   ├── evaluate/
│   │   └── evaluate.ts              # Existing evaluation logic
│   ├── workspace/                   # Newly added
│   │   ├── setup.ts                 # Workspace initialization
│   │   └── benchmark.ts             # Benchmark execution
│   └── benchmark-workspace-default/ # Source for benchmark-workspace copy
│       ├── evaluation/
│       └── execution/               # Existing test data
│           ├── input/
│           └── reference/          
└── benchmark-workspace/             # Created at runtime. Subject to gitignore.
    ├── evaluation/
    └── execution/
        ├── input/
        ├── output/                  # Output location for execution
        └── reference/
```

## package.json Script Addition ✅ **COMPLETED**

**Current Scripts (implemented):**
```json
{
  "scripts": {
    "setup-workspace": "node --experimental-strip-types src/cli/setup-workspace.ts",
    "evaluate-schema": "node --experimental-strip-types src/cli/evaluate-schema.ts"
  }
}
```

**Usage:**
- `pnpm setup-workspace` - Initialize benchmark workspace
- `pnpm evaluate-schema` - Run schema evaluation (all cases)
- `pnpm evaluate-schema --case=case-001` - Evaluate specific case
- `pnpm evaluate-schema --cases=case-001,case-002` - Evaluate multiple cases

## Implementation Details

### Main Functions of setup.ts
- Directory creation (`fs.mkdirSync`)
- File copying (`fs.copyFileSync`)
- Configuration file generation (workspace settings)

### Main Functions of benchmark.ts
- File reading (`fs.readFileSync`)
- JSON parsing and validation
- `evaluate` function invocation
- Result file output (`fs.writeFileSync`)

## Usage Scenarios ✅ **COMPLETED**

### Complete Benchmark Workflow ✅ **IMPLEMENTED**

1. **Workspace Initialization**:
   ```bash
   pnpm setup-workspace
   ```
   - Data is placed in `benchmark-workspace/execution/input/` and `benchmark-workspace/execution/reference/`

2. **External Processing Execution** (executed outside schema-bench package):
   ```bash
   # Example: Processing in another agent package
   # execution/input/ → execution/output/ conversion processing
   # This processing is executed by external tools or AI models
   ```
   - Process data from `benchmark-workspace/execution/input/`
   - Output results to `benchmark-workspace/execution/output/`

3. **Benchmark Evaluation Execution**:
   ```bash
   pnpm evaluate-schema
   ```
   - Compare `execution/output/` and `execution/reference/`
   - Output evaluation results to `evaluation/`

### Available Commands ✅ **IMPLEMENTED**

- **Workspace preparation only**:
  ```bash
  pnpm setup-workspace
  ```

- **Evaluation only** (when external processing is completed):
  ```bash
  pnpm evaluate-schema                    # All cases
  pnpm evaluate-schema --case=case-001    # Specific case
  pnpm evaluate-schema --cases=case-001,case-002  # Multiple cases
  ```

- **Features beyond original spec**:
  - Flexible command-line argument parsing
  - Partial failure handling (continue with successful cases)
  - Rich evaluation metrics and mappings output
  - Summary reports for multiple case evaluations

## Extensibility

- Batch processing of multiple cases
- Result visualization functionality
- CI/CD pipeline integration
- Result comparison functionality (comparison with past results)

## Technical Considerations

### Dependencies
- `fs`: File system operations
- Existing `@liam-hq/db-structure` type definitions

### Error Handling
- File existence check
- JSON format validation
- Schema format validation

### run-benchmark Execution Options
- **Single case execution**: Evaluate only a single case by specifying a specific case ID
  ```bash
  pnpm run-benchmark --case case-001
  ```
- **All cases execution**: Batch evaluation of all cases in execution/output/ (default behavior)
  ```bash
  pnpm run-benchmark
  ```
- **Multiple case specified execution**: Partial evaluation by specifying multiple case IDs
  ```bash
  pnpm run-benchmark --cases case-001,case-002,case-003
  ```

### Representative Value Calculation for Multiple Case Execution
- **Average**: Calculate arithmetic mean of all metrics
- **Median**: Representative value that suppresses the influence of outliers
- **Standard Deviation**: Evaluate metric variability
- **Min/Max Values**: Understand performance range
- **Aggregated Result Output**: Output as `summary_results_{timestamp}.json`

## Future Considerations

1. **Case/Dataset Management**: Management method for multiple benchmark cases and datasets
2. **Result Format**: Establishment of standard evaluation result format
3. **Visualization**: Integration of evaluation result visualization tools
4. **Comparison Functionality**: Result comparison functionality for different models and methods
5. **Execution Option Extensions**: 
   - Filtering functionality (filtering by metric thresholds)
   - Acceleration through parallel execution
   - Improvement of progress display and log output
6. **Statistical Analysis Functionality**:
   - Confidence interval calculation
   - Statistical significance testing
   - Statistical interpretation support for results

Based on this specification, the schema-bench package functionality will be expanded step by step.

## Implementation Steps

### Phase 1: Basic Feature Implementation ✅ **COMPLETED**

#### Step 1: Project Structure Preparation ✅ **COMPLETED**
1. **Directory Creation** ✅ **COMPLETED**
   ```
   frontend/internal-packages/schema-bench/src/workspace/
   ├── setup/
   │   ├── setup.ts            # ✅ Implemented
   │   └── setup.test.ts       # ✅ Implemented
   ├── evaluation/
   │   ├── evaluation.ts       # ✅ Implemented
   │   └── evaluation.test.ts  # ✅ Implemented
   └── types.ts                # ✅ Implemented
   ```

2. **benchmark-workspace-default Preparation** ✅ **COMPLETED**
   ```
   frontend/internal-packages/schema-bench/benchmark-workspace-default/
   └── execution/
       ├── input/
       │   └── case-001.json    # ✅ Sample input data exists
       └── reference/
           └── case-001.json    # ✅ Sample reference data exists
   ```

#### Step 2: Workspace Initialization Feature Implementation ✅ **COMPLETED**

**Implementation Content:** ✅ **COMPLETED**
- ✅ `createWorkspaceDirectories()`: Create directory structure
- ✅ `copyDefaultData()`: Copy default data
- ✅ `validateWorkspace()`: Validate workspace structure

**Processing Flow:** ✅ **COMPLETED**
1. ✅ Check existence of `./benchmark-workspace/`
2. ✅ Overwrite existing workspace (no prompt - automated)
3. ✅ Create directory structure
4. ✅ Copy data from `benchmark-workspace-default/`
5. ✅ Validate workspace structure

#### Step 3: Benchmark Evaluation Feature Implementation ✅ **COMPLETED**

**Implementation Content:** ✅ **COMPLETED**
- ✅ `loadOutputData()`: Load data from output/
- ✅ `loadReferenceData()`: Load data from reference/
- ✅ `runEvaluation()`: Call existing evaluate function
- ✅ `saveResults()`: Save evaluation results

**Processing Flow:** ✅ **COMPLETED**
1. ✅ Check existence of `execution/output/` and `execution/reference/`
2. ✅ Search and load corresponding case files
3. ✅ Data format validation with valibot
4. ✅ Execute evaluation using `evaluate` function
5. ✅ Save results to `evaluation/`
6. ✅ Display evaluation completion summary

#### Step 4: CLI Script Implementation ✅ **COMPLETED**

**CLI Scripts:** ✅ **COMPLETED**
- ✅ `src/cli/setup-workspace.ts`: Workspace setup CLI
- ✅ `src/cli/evaluate-schema.ts`: Schema evaluation CLI

**package.json Scripts:** ✅ **COMPLETED**
```json
{
  "scripts": {
    "setup-workspace": "node --experimental-strip-types src/cli/setup-workspace.ts",
    "evaluate-schema": "node --experimental-strip-types src/cli/evaluate-schema.ts"
  }
}
```

**Additional Features Implemented:**
- ✅ Command-line argument parsing for case-specific evaluation
- ✅ Support for `--case=case-001` and `--cases=case-001,case-002` arguments
- ✅ Comprehensive error handling with detailed error messages
- ✅ Partial failure handling (continue with successful cases)
- ✅ Summary results for multiple case evaluations

### Phase 2: Feature Extensions ✅ **PARTIALLY COMPLETED**

#### Step 5: Enhanced Error Handling ✅ **COMPLETED**
- ✅ File existence check with detailed error messages
- ✅ JSON format validation with valibot schema validation
- ✅ Schema format validation using `@liam-hq/db-structure` schema
- ✅ Detailed error messages with `formatError` utility
- ✅ Partial failure handling (continue with successful cases)

#### Step 6: Multiple Case Support ✅ **COMPLETED**
- ✅ Batch processing of all cases (default behavior)
- ✅ Specific case specified execution with `--case=case-001`
- ✅ Multiple case execution with `--cases=case-001,case-002`
- ✅ Progress display functionality with console warnings for failures

#### Step 7: Result Output Improvement ✅ **PARTIALLY COMPLETED**
- ✅ Statistical information calculation with `calculateAverageMetrics` (平均値のみ)
- ✅ Result summary display with individual and summary files
- ✅ Log output improvement with structured console messages
- ✅ Detailed evaluation results with metrics and mappings

### Detailed Implementation Specifications

#### Detailed Implementation of setup.ts

```typescript
interface WorkspaceConfig {
  workspacePath: string;
  defaultDataPath: string;
  overwrite: boolean;
}

export const setupWorkspace = async (config: WorkspaceConfig) => {
  // 1. Directory creation
  await createDirectories(config.workspacePath);
  
  // 2. Default data copy
  await copyDefaultData(config.defaultDataPath, config.workspacePath);
  
  // 3. Validation
  await validateWorkspace(config.workspacePath);
  
  console.log('✅ Workspace setup completed successfully');
};
```

#### Detailed Implementation of benchmark.ts

```typescript
interface BenchmarkConfig {
  workspacePath: string;
  caseId?: string;
  outputFormat: 'json' | 'summary';
}

export const runBenchmark = async (config: BenchmarkConfig) => {
  // 1. Data loading
  const cases = await loadBenchmarkCases(config);
  
  // 2. Evaluation execution
  const results = await Promise.all(
    cases.map(caseData => evaluateCase(caseData))
  );
  
  // 3. Result saving
  await saveResults(results, config);
  
  // 4. Summary display
  displaySummary(results);
};
```

### Testing Strategy

#### Unit Tests
- `setup.ts`: Directory creation, file copying functionality
- `benchmark.ts`: Data loading, evaluation execution, result saving functionality

#### Integration Tests
- Complete workflow (setup → benchmark)
- Multiple case processing
- Error case processing

#### E2E Tests
- Actual command execution tests
- File system operation validation

### Implementation Order ✅ **COMPLETED**

1. ✅ **Week 1**: Step 1-2 (Project structure + setup.ts)
2. ✅ **Week 2**: Step 3-4 (benchmark.ts + package.json)
3. ✅ **Week 3**: Step 5-6 (Error handling + Multiple case support)
4. ✅ **Week 4**: Step 7 + Test implementation

**Actual Implementation Status:**
- All planned features have been successfully implemented
- The schema-bench package is now fully functional with workspace management
- Enhanced features beyond the original spec have been added

### Success Criteria ✅ **ALL COMPLETED**

#### Phase 1 Completion ✅ **COMPLETED**
- ✅ `pnpm setup-workspace` executes normally
- ✅ Workspace structure is created correctly
- ✅ `pnpm evaluate-schema` executes normally
- ✅ Evaluation results are output correctly

#### Phase 2 Completion ✅ **PARTIALLY COMPLETED**
- ✅ Error cases are handled appropriately
- ✅ Batch processing of multiple cases is possible

#### Additional Achievements ✅ **COMPLETED**
- ✅ CLI argument parsing for flexible evaluation options
- ✅ Comprehensive test coverage with unit tests
- ✅ Robust error handling with neverthrow Result types
- ✅ Partial failure handling for production resilience
- ✅ Rich output format with detailed metrics and mappings

### Dependencies and Risks

#### Technical Dependencies
- Stability of existing `evaluate` function
- Compatibility of `@liam-hq/db-structure` type definitions
- Node.js file system API

#### Risk Factors
- Memory usage during large data processing
- Race conditions during concurrent processing
- File system permission issues

#### Mitigation Strategies
- Memory usage monitoring and streaming processing
- Implementation of file locking mechanism
- Permission checking and error handling
