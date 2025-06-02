<h1 align="center">
  <img src="./assets/logo-light.png#gh-light-mode-only" alt="Liam ERD" width="445">
  <img src="./assets/logo-dark.png#gh-dark-mode-only" alt="Liam ERD" width="445">
</h1>

<h2 align="center">
  Automatically generates beautiful and easy-to-read ER diagrams from your database.
</h2>

<p align="center">
  <a href="https://deepwiki.com/liam-hq/liam"><img src="https://img.shields.io/badge/DeepWiki-liam--hq%2Fliam-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==" alt="DeepWiki"></a>
  <a href="https://www.npmjs.com/package/@liam-hq/cli"><img src="https://img.shields.io/npm/v/%40liam-hq%2Fcli" /></a>
  <a href="https://github.com/liam-hq/liam/blob/main/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" /></a>
  <a href="https://github.com/liam-hq/liam/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202-blue" /></a>
  <a href="https://x.com/liam_app"><img src="https://img.shields.io/twitter/follow/liam_app?style=social" alt="Follow us on X, formerly Twitter" /></a>
</p>

<p align="center">
  <a href="https://trendshift.io/repositories/12939" target="_blank"><img src="https://trendshift.io/api/badge/repositories/12939" alt="liam-hq%2Fliam | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
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

## Star History

<a href="https://www.star-history.com/#liam-hq/liam&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=liam-hq/liam&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=liam-hq/liam&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=liam-hq/liam&type=Date" />
 </picture>
</a>

## License

Liam ERD is licensed under the [Apache License Version 2.0](LICENSE).

Licenses for third-party packages can be found in [docs/packages-license.md](docs/packages-license.md).
