---
"@liam-hq/cli": patch
---

Improve static file serving experience with better cache control

- Add cache-disabling flag (`-c-1`) to all `http-server` command examples to prevent browsers from caching ERD files
- Recommend `npx serve` as the primary static file server over `http-server` for better user experience
- Auto-generate `serve.json` configuration file in build output that sets `Cache-Control: no-cache` headers for HTML and JSON files when using the `serve` package

These changes ensure users always see the latest ERD visualization after regeneration without manual cache clearing.