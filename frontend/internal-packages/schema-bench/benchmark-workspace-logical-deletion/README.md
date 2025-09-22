# Logical Deletion Benchmark

This dataset evaluates schema design choices for user deletion in an e-commerce context without relying on a naive `is_deleted` flag. It emphasizes:

- Data separation for PII vs. operational references
- Referential integrity across orders and analytics
- Legal retention and auditability
- Business metrics such as account closure reasons

## Run This Dataset

You can run these commands from this directory (PnPM will resolve the workspace root automatically):

1) Setup the benchmark workspace (includes this dataset):

```bash
pnpm --filter @liam-hq/schema-bench setupWorkspace
```

2) Execute schema generation for only this dataset (LiamDB):

```bash
pnpm --filter @liam-hq/schema-bench executeLiamDB -logical-deletion
```

3) Evaluate results for only this dataset:

```bash
pnpm --filter @liam-hq/schema-bench evaluateSchemaMulti logical-deletion
```

Generated files appear under `benchmark-workspace/logical-deletion/`:

- `execution/input/`: input prompts
- `execution/output/`: generated schemas
- `execution/reference/`: reference schemas
- `evaluation/`: per-case and summary evaluation results

