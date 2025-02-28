<h1 align="center">
  <img src="./assets/logo-light.png#gh-light-mode-only" alt="Liam ERD" width="445">
  <img src="./assets/logo-dark.png#gh-dark-mode-only" alt="Liam ERD" width="445">
</h1>

<h2 align="center">
  Automatically generates beautiful and easy-to-read ER diagrams from your database.
</h2>

<p align="center">
  <a href="https://www.npmjs.com/package/@liam-hq/cli"><img src="https://img.shields.io/npm/v/%40liam-hq%2Fcli" /></a>
  <a href="https://github.com/liam-hq/liam/blob/main/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" /></a>
  <a href="https://github.com/liam-hq/liam/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202-blue" /></a>
  <a href="https://x.com/liam_app"><img src="https://img.shields.io/twitter/follow/liam_app?style=social" alt="Follow us on X, formerly Twitter" /></a>
</p>

![demo](./assets/demo.gif)

<p align="center">
  <a href="https://liambx.com">Website</a> •
  <a href="https://liambx.com/docs">Documentation</a> •
  <a href="https://github.com/orgs/liam-hq/projects/1/views/1">Roadmap</a>
</p>

## What's Liam ERD?

Liam ERD generates beautiful, interactive ER diagrams from your database. Whether you're working on public or private repositories, Liam ERD helps you visualize complex schemas with ease.

- **Beautiful UI & Interactive**: A clean design and intuitive features (like panning, zooming, and filtering) make it easy to understand even the most complex databases.
- **Simple Reverse Engineering**: Seamlessly turn your existing database schemas into clear, readable diagrams.
- **Effortless Setup**: Get started with zero configuration—just provide your schema, and you're good to go.
- **High Performance**: Optimized for both small and large projects, easily handling 100+ tables.
- **Fully Open-Source**: Contribute to the project and shape Liam ERD to fit your needs.

## Quick Start

### For Public Repositories

Insert `liambx.com/erd/p/` into your schema file's URL:

```
# Original: https://github.com/user/repo/blob/master/db/schema.rb
# Modified: https://liambx.com/erd/p/github.com/user/repo/blob/master/db/schema.rb
                  👾^^^^^^^^^^^^^^^^👾
```

### For Private Repositories

Run the interactive setup:

```bash
npx @liam-hq/cli init
```

<img src="./assets/jack.gif" alt="Jack" width="40"> **If you find this project helpful, please give it a star! ⭐**  
Your support helps us reach a wider audience and continue development.

## Documentation

Check out the full documentation on [the website](https://liambx.com/docs).

## Roadmap

See what we're working on and what's coming next on [our roadmap](https://github.com/orgs/liam-hq/projects/1/views/1).

## Contributing

Refer to our [contribution guidelines](./CONTRIBUTING.md) and [Code of Conduct for contributors](./CODE_OF_CONDUCT.md).

## Contributors

<a href="https://github.com/liam-hq/liam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=liam-hq/liam" />
</a>

## License

Liam ERD is licensed under the [Apache License Version 2.0](LICENSE).

Licenses for third-party packages can be found in [docs/packages-license.md](docs/packages-license.md).
