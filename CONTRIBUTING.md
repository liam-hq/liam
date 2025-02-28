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

3. Development

   ```sh
   pnpm dev
   ```

4. Open apps

   | package          | url                   |
   | ---------------- | --------------------- |
   | @liam-hq/erd-web | http://localhost:3001 |
   | @liam-hq/cli     | http://localhost:5173 |
   | @liam-hq/docs    | http://localhost:3002 |

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
