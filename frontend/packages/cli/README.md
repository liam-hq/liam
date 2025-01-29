# @liam-hq/cli

Command-line tool designed to generate a web application that displays ER diagrams.

```bash
$ liam erd build --input {your .sql} --format postgres
# Outputs the web application to the ./public and ./dist directories
```

```bash
# Or use a `db/schema.rb` file (from your Ruby on Rails app).
$ liam erd build --input {your schema.rb} --format schemarb
# Outputs the web application to the `./dist` directory
```

```bash
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
pnpm run build
# The executable will be output to dist-cli/bin/cli.js.
```

After building, you can invoke it locally with:

```bash
node ./dist-cli/bin/cli.js erd build --input ./fixtures/input.schema.rb --format schemarb
```

To make it globally accessible as `liam`, use:

```bash
pnpm link --global
```

## Development npm Scripts Explanation

### ER Diagram App Development with Vite

- **Dev Command**
   ```bash
   pnpm dev
   ```
   This command currently performs the following actions:
   - Builds the CLI.
   - Executes the CLI with the command `erd build --input ./fixtures/input.schema.rb --format schemarb`.
   - Copies the generated `schema.json` to the `public/` directory and launches the Vite development server.

## Project File Structure

- **`bin/cli.ts`**: This is the main CLI script.
- **`src/cli/`**: Contains the source code for the CLI.
- **`fixtures/input.schema.rb`**: A sample input file used for testing and development purposes.
- **`src/{App,main}.tsx`**, **`index.html`**: These files constitute the web application's entry point, which displays ER diagrams.
