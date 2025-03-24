# Contributing

Thank you for your interest in this project! Please contribute according to the following guidelines:

Please note we have a [code of conduct](CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Development environment setup

Before setting up the development environment, we recommend reviewing our [Repository Architecture](https://liambx.com/docs/contributing/repository-architecture) documentation to understand how our packages are organized.

To set up a development environment, please follow these steps:

1. Clone the repo

   ```sh
   git clone https://github.com/liam-hq/liam
   ```

2. Install npm package

   ```sh
   corepack enable
   corepack prepare
   pnpm install
   ```

3. Set up environment variables

   **For maintainers (Vercel team members only):**

   First, link your local project to the Vercel project:

   ```sh
   pnpm vercel:link
   ```

   Follow the prompts to:

   - Confirm setup for the current directory
   - Select the "ROUTE06 Core" scope
   - Link to the existing "liam-app" project

   Once linked, you can pull the latest environment variables from Vercel:

   ```sh
   pnpm vercel:env-pull
   ```

   This will download the environment variables from Vercel and write them to the specified file. After updating environment variables on Vercel (through the dashboard or CLI), you'll need to run this command again to get the updated values.

   Next, create a `.env.local` file at the root directory and set values for the following keys:

   - `OPENAI_API_KEY`
   - `TRIGGER_SECRET_KEY`

   **For other contributors:**

   Copy the template environment file to create your local environment file:

   ```sh
   cp .env.template .env
   ```

   Then edit the `.env` file and fill in the necessary values for the environment variables you need for your development work.

   These environment variables provide access to Supabase, GitHub App, Trigger.dev, and other service credentials needed for development.

4. Development

   ```sh
   pnpm dev
   ```

5. Open apps

   | package       | url                   |
   | ------------- | --------------------- |
   | @liam-hq/app  | http://localhost:3001 |
   | @liam-hq/cli  | http://localhost:5173 |
   | @liam-hq/docs | http://localhost:3002 |

## Issues and feature requests

You've found a bug in the source code, a mistake in the documentation or maybe you'd like a new feature? Take a look at [GitHub Discussions](https://github.com/liam-hq/liam/discussions) to see if it's already being discussed. You can help us by [submitting an issue on GitHub](https://github.com/liam-hq/liam/issues). Before you create an issue, make sure to search the issue archive -- your issue may have already been addressed!

Please try to create bug reports that are:

- _Reproducible._ Include steps to reproduce the problem.
- _Specific._ Include as much detail as possible: which version, what environment, etc.
- _Unique._ Do not duplicate existing opened issues.
- _Scoped to a Single Bug._ One bug per report.

**Even better: Submit a pull request with a fix or new feature!**

### How to submit a Pull Request

1. Search our repository for open or closed [Pull Requests](https://github.com/liam-hq/liam/pulls) that relate to your submission. You don't want to duplicate effort.
2. Fork the project
3. Create your feature branch (`git switch -c feat/amazing_feature`)
4. **Write a clear and concise changeset description**
   - If your changes include modifications to any packages within the `frontend/packages` directory:
     - Use `pnpm changeset` at the top level of this project.
   - **Write a clear and concise commit message using the emoji (e.g., ✨) itself, not the textual representation (e.g., `:sparkles:`).** A list of supported gitmojis can be found [here](https://gitmoji.dev/). Examples:
     - ✨ Added a new feature to filter tables
     - 🐛 Fixed a typo in the welcome message
     - 📝 Updated README.md with new installation instructions
   - Note: Changes to `@liam-hq/docs` package do not require changesets as it is listed in the ignore array in `.changeset/config.json`. You will see a message from the changeset-bot titled "⚠️ No Changeset found" - this is the expected behavior and confirms that the ignore configuration is working correctly.
5. Commit your changes (`git commit -m 'feat: add amazing_feature'`)
6. Push to the branch (`git push origin feat/amazing_feature`)
7. [Open a Pull Request](https://github.com/liam-hq/liam/compare?expand=1)
