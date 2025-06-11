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

2. Run the setup script

   ```sh
   ./scripts/setup-local-dev.sh
   ```

   This script will:
   - Install dependencies with pnpm
   - Create .env file from template
   - Start Supabase database
   - Configure Supabase authentication keys
   - Display next steps and test credentials

   Alternatively, you can run the setup steps manually:

   ```sh
   corepack enable
   corepack prepare
   pnpm install
   ```

3. Set up environment variables

   Copy the template environment file to create your local environment file:

   ```sh
   cp .env.template .env
   ```

   **Required for basic local development:**
   - Supabase keys will be automatically configured when you start the database (see step 4)

   **For maintainers (Vercel team members only):**

   Link your local project to the Vercel project and pull environment variables:

   ```sh
   pnpm vercel:link
   pnpm vercel:env-pull
   ```



   Next, create a `.env.local` file at the root directory and set values for the following keys:

   - `OPENAI_API_KEY`
   - `TRIGGER_SECRET_KEY`

4. Start the development server

   ```sh
   pnpm dev
   ```

5. Open apps

   | package            | url                   |
   | ------------------ | --------------------- |
   | @liam-hq/app       | http://localhost:3001 |
   | @liam-hq/cli       | http://localhost:5173 |
   | @liam-hq/docs      | http://localhost:3002 |
   | @liam-hq/storybook | http://localhost:6006 |

   **Test login credentials:**
   - Login path: http://localhost:3001/app/login
   - Email: `test@example.com`
   - Password: `liampassword1234`

## Issues and feature requests

You've found a bug in the source code, a mistake in the documentation or maybe you'd like a new feature? Take a look at [GitHub Discussions](https://github.com/liam-hq/liam/discussions) to see if it's already being discussed. You can help us by [submitting an issue on GitHub](https://github.com/liam-hq/liam/issues). Before you create an issue, make sure to search the issue archive -- your issue may have already been addressed!

## Troubleshooting

### Common Setup Issues

**GitHub API Errors in Console**
If you see errors like `[@octokit/auth-app] appId option is required`, this is expected when GitHub environment variables are not configured. These errors don't affect core functionality - you can still use authentication, view projects, and access ER diagrams.

**Login Page Redirects**
If `/app/login` redirects unexpectedly:
1. Ensure Supabase is running: `pnpm --filter @liam-hq/db supabase:status`
2. Check that Supabase keys are configured in `.env`
3. Restart the development server: `pnpm dev`

**Database Connection Issues**
If you encounter database connection problems:
1. Stop Supabase: `pnpm --filter @liam-hq/db supabase:stop`
2. Start Supabase: `pnpm --filter @liam-hq/db supabase:start`
3. Re-run key extraction scripts:
   ```sh
   ./scripts/extract-supabase-anon-key.sh
   ./scripts/extract-supabase-service-key.sh
   ```

**Missing Dependencies**
If you encounter missing dependency errors:
1. Ensure you have the correct Node.js version (check `.nvmrc`)
2. Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
3. Enable corepack: `corepack enable && corepack prepare`

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
5. Format your changes (`pnpm run fmt`)
6. Commit your changes (`git commit -m 'feat: add amazing_feature'`)
7. Push to the branch (`git push origin feat/amazing_feature`)
8. [Open a Pull Request](https://github.com/liam-hq/liam/compare?expand=1)
