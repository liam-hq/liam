# Review Guidelines

This document defines code review guidelines for the liam-hq/liam repository.

## General Principles

### Code Quality

- **Readability**: Code should be clear and easy to understand
- **Maintainability**: Future changes and extensions should be straightforward
- **Consistency**: Follow existing codebase style and conventions
- **Simplicity**: Avoid unnecessary complexity

### Security

- **Sensitive Information**: No API keys, passwords, or secrets in code
- **Authentication & Authorization**: Proper authentication mechanisms implemented
- **Input Validation**: User input properly validated
- **Dependencies**: No dependencies with known security vulnerabilities

### Performance

- **Efficiency**: Appropriate algorithm and data structure choices
- **Resource Usage**: Optimized memory and CPU usage
- **Scalability**: Design that can handle future scale

## Coding Standards

### Biome Configuration Compliance

This project uses Biome for code quality. Follow these settings:

- **Formatting**:
  - Indent: 2 spaces
  - Line width: 80 characters
  - Quotes: Single quotes (`'`)
  - Semicolons: As needed (asNeeded)

- **Linter Rules**:
  - `noUnusedVariables`: No unused variables
  - `noUndeclaredVariables`: No undeclared variables
  - `noUnusedImports`: No unused imports
  - `noConsole`: Only `console.warn`, `console.error`, `console.info`, `console.debug` allowed (no `console.log`)
  - `noUndeclaredDependencies`: All dependencies must be declared
  - `useExhaustiveDependencies`: React hooks must have exhaustive dependencies
  - `noExcessiveCognitiveComplexity`: Keep functions simple
  - `noParameterAssign`: Don't reassign parameters
  - `useSelfClosingElements`: Use self-closing tags when appropriate

### TypeScript / JavaScript

- **Type Safety**: Use proper type definitions, avoid `any`
- **Naming Conventions**: 
  - Variables/functions: camelCase
  - Components/classes: PascalCase
  - Constants: UPPER_SNAKE_CASE
- **Imports**: 
  - Remove unused imports
  - Imports are organized (Biome's organizeImports is enabled)

### React Components

- **File Structure**: Follow the monorepo structure under `frontend/`
- **CSS Modules**: Use CSS Modules for styling
- **Props Type Definition**: Props must have clear type definitions
- **Hooks**: Follow React hooks best practices with exhaustive dependencies

### Monorepo Structure

- **Packages**: Code organized under `frontend/packages/`, `frontend/apps/`, and `frontend/internal-packages/`
- **Build Dependencies**: Respect Turbo build dependencies (see `turbo.json`)
- **Package Dependencies**: Declare all dependencies properly for each package

### Git Commits

- **Commit Messages**: Clear description of changes
- **Commit Size**: Appropriate granularity (not too large, not too small)
- **Commit History**: No unnecessary merge commits or reverts

## Pull Request Guidelines

### PR Description

- **Purpose**: Clear statement of PR purpose
- **Changes**: What was changed
- **Key Points**: What reviewers should focus on
- **Related Issues**: Link to related GitHub Issues
- **Language**: Write in English

### Changesets

- Follow the [Changeset Creation Guide](./changeset-guide.md)
- Add appropriate changesets for versioned packages

### Testing

- **Test Addition**: Appropriate tests added for new features or fixes
- **Existing Tests**: All existing tests pass
- **Edge Cases**: Edge case testing considered

### Documentation

- **README Updates**: README updated when necessary
- **Comments**: Complex logic has appropriate comments (but avoid excessive comments)
- **Type Definitions**: Public API type definitions properly documented

## Project-Specific Guidelines

### Directory Structure

- **frontend/packages/**: Public packages (`@liam-hq/cli`, `@liam-hq/erd-core`, `@liam-hq/schema`, `@liam-hq/ui`)
- **frontend/apps/**: Applications (`@liam-hq/app`, `@liam-hq/docs`, `@liam-hq/storybook`)
- **frontend/internal-packages/**: Internal packages (configs, e2e, etc.)
- **docs/**: Documentation files
- **scripts/**: Setup and utility scripts

### Build System (Turbo)

- **Build Order**: Respect build dependencies defined in `turbo.json`
- **Generation**: Run `gen` tasks before building when needed
- **Lint Dependencies**: Lint tasks depend on `gen` and `^build`
- **Test Dependencies**: Test tasks depend on `^build` and `gen`

### Linting and Formatting

- **Before Commit**: Run `pnpm run fmt` to format code
- **Lint Check**: Run `pnpm run lint` to check for issues
- **Stylelint**: CSS files must pass stylelint checks
- **Knip**: Unused dependencies and exports must be removed
- **Syncpack**: Package versions must be synchronized across workspace

### Dependencies

- **No Unnecessary Dependencies**: Don't add unnecessary dependencies
- **Version Management**: Dependencies managed with syncpack
- **License Compliance**: Check licenses of added dependencies

### Environment Setup

- **Environment Variables**: Use `.env.template` as reference
- **Supabase**: Local development uses Supabase
- **Test Credentials**: Use provided test credentials for local development

## Review Process

### Reviewer Responsibilities

- **Constructive Feedback**: Provide specific and constructive feedback
- **Timely Review**: Review as quickly as possible
- **Clarify Questions**: Ask questions to clarify unclear points

### PR Author Responsibilities

- **Respond to Reviews**: Respond appropriately to review comments
- **Add Explanations**: Provide additional explanations when needed
- **Fix Issues**: Fix identified problems

### Merge Criteria

- **Approval**: Obtained approval from reviewers
- **CI/CD**: All CI/CD checks pass
- **Conflicts**: Merge conflicts resolved
- **Review Comments**: All review comments addressed

## Checklist

Use this checklist when reviewing:

- [ ] Code follows Biome configuration
- [ ] Type safety maintained
- [ ] No security issues
- [ ] No performance issues
- [ ] Tests appropriately added
- [ ] Documentation updated
- [ ] PR description sufficient
- [ ] Changesets added (if needed)
- [ ] Commit messages clear
- [ ] Consistency with existing codebase maintained
- [ ] Build dependencies respected
- [ ] No unused dependencies or exports
- [ ] Package versions synchronized

## Common Issues to Watch For

### Build Issues

- **Missing Build Artifacts**: Ensure `@liam-hq/db-structure` is built before linting
- **Generation Tasks**: Run `gen` tasks when schema definitions change
- **Turbo Cache**: Clear Turbo cache if builds behave unexpectedly

### Lint Issues

- **Console Logs**: Remove `console.log` statements (use `console.info`, `console.warn`, `console.error`, or `console.debug` instead)
- **Unused Imports**: Remove unused imports
- **Exhaustive Dependencies**: Ensure React hooks have all dependencies listed
- **Undeclared Dependencies**: Declare all used dependencies in package.json

### Test Issues

- **Test Principles**: Follow [test principles](./test-principles.md)
- **E2E Tests**: E2E tests depend on builds being complete
- **Coverage**: Maintain or improve test coverage

## References

- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [README.md](../README.md)
- [Changeset Creation Guide](./changeset-guide.md)
- [Test Principles](./test-principles.md)
- [Biome Official Documentation](https://biomejs.dev/)
- [Turbo Documentation](https://turbo.build/repo/docs)
