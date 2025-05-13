# Figma to CSS Variables

## Overview

This script is designed to handle various tasks related to Figma local variables and Style Dictionary. It can fetch Figma local variables, transform them for Style Dictionary, and run Style Dictionary with specified options.

## Environment Variables

The script requires the following environment variables:

- `FIGMA_FILE_KEY`: The key of the Figma file.
- `FIGMA_ACCESS_TOKEN`: The token to access the Figma API.

## Command Line Arguments

The script accepts the following command line arguments:

- `--fetch`: Fetches Figma local variables.
- `--transform`: Transforms variables for Style Dictionary.
- `--generate`: Runs Style Dictionary with the specified output path.
- `--output <path>`: Specifies the output path for the generated files. Defaults to 'build/css'.
- `--filter-modes <modes>`: Specifies filter modes for Style Dictionary as a comma-separated list.

If no specific argument is provided, the script defaults to running all steps in sequence.

## Usage

### Setting up environment variables

To set up the required environment variables:

1. Create a `.env.local` file in the root of this package based on the `.env.local.example` template:

```sh
cp .env.local.example .env.local
```

2. Edit the `.env.local` file and replace the placeholder values with your actual Figma API credentials:

```
FIGMA_FILE_KEY=your_figma_file_key
FIGMA_ACCESS_TOKEN=your_figma_access_token
```

Note: The script will only check for environment variables in the package-specific `.env.local` file.

---

The Figma file key can be found in the URL of your Figma file: `https://www.figma.com/file/YOUR_FILE_KEY/...`

To get a Figma access token, go to Figma > Account Settings > Personal Access Tokens > Create a new personal access token.

### Running the script

To run the script with custom options:

```sh
pnpm --filter @liam-hq/figma-to-css-variables sync --output '../../apps/service-site/src/styles' --filter-modes 'Dark,Mode 1'
```

To update the UI package CSS variables (recommended):

```sh
pnpm --filter @liam-hq/figma-to-css-variables sync:ui
```

This will update the CSS variables in `frontend/packages/ui/src/styles` with the modes 'Dark' and 'Mode 1'.
