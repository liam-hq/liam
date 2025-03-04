# 20241128 - Use ``libpg-query`` for postgreSQL SQL parsing


## Status

- [ ] Proposed
- [x] Accepted
- [ ] Rejected
- [ ] Deprecated
- [ ] Superseded


## Context

We needed a robust and efficient SQL parser for PostgreSQL to integrate into our system. Several parsing options were evaluated, including Azimutt, ANTLR, and ``libpg-query``. While each had its advantages, we prioritized parsing accuracy, performance, and maintainability.

## Decision

We chose to use ``@codyjasonbennett/pg-query-emscripten``, which is a WebAssembly-compiled version of ``libpg-query``. This decision was based on the following factors:

**Parsing Speed**: Benchmarks showed that ``libpg-query`` (including its WebAssembly variant) outperformed alternatives like ANTLR in terms of parsing speed.

**PostgreSQL Compatibility**: Since ``libpg-query`` is based on PostgreSQL's internal parser, it provides the highest accuracy and support for PostgreSQL-specific syntax and extensions.

## Consequences

### Positive Impacts

- High Accuracy: Ensures correct parsing of PostgreSQL-specific syntax.
- Performance: Faster than alternatives, reducing query parsing overhead.
- Lightweight & Portable: WebAssembly eliminates the need for native binaries.

### Negative Impacts

- Limited to PostgreSQL: Unlike ANTLR, which supports multiple SQL dialects, ``libpg-query`` is PostgreSQL-specific.
- WebAssembly Dependency: Requires handling WebAssembly execution within our environment.

### Neutral Impacts

- Potential for Future Expansion: While ANTLR remains a viable option for broader SQL dialect support, ``libpg-query`` meets our immediate PostgreSQL needs effectively.

