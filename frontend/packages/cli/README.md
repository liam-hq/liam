# @liam/cli

Command-line tool designed to generate a web application that displays ER diagrams.

```bash
$ liam erd build --input {your .sql}
# Outputs the web application to the ./public and ./dist directories

$ liam erd preview
# Launches the web application for preview
```

## Test

```bash
pnpm run test
```

## Building and Installing the Standalone CLI for Development

To build the CLI for development purposes, run:

```bash
pnpm run build:cli
# The executable will be output to dist-cli/bin/cli.js.
```

After building, you can invoke it locally with:

```bash
node ./dist-cli/bin/cli.js erd build --input ./fixtures/input.sql
```

To make it globally accessible as `liam`, use:

```bash
pnpm link --global
```

## Explanation of npm Scripts for Development

### Commands

1. **Build**
   ```bash
   pnpm run build
   ```
   - Internally, `./fixtures/input.sql` is passed as the `build --input` argument.
   - Runs Vite's build process.

2. **Dev**
   ```bash
   pnpm run dev
   ```
   - Internally, `./fixtures/input.sql` is passed as the `dev --input` argument.
   - Starts the Vite development server.

3. **Preview**
   ```bash
   pnpm run preview
   ```
   - Previews the production build using Vite's built-in preview functionality.

## File Structure

- **bin/cli.ts**: The main CLI script.
- **fixtures/input.sql**: A sample `.sql` file for testing purposes.
- **src/**: The web application that displays ER diagrams.
