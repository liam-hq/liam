# @liam-hq/assets

Static asset CDN for Liam ERD components.

## Overview

This application serves static assets (images, videos, etc.) for Liam ERD components via Vercel's edge network. It uses the Vercel Output API for optimized static file serving.

## Directory Structure

```
public/
├── erd-core/
│   └── 2025-01/         # Versioned assets for January 2025
│       ├── videos/
│       │   ├── copy-link.mp4
│       │   ├── tidy-up.mp4
│       │   └── zoom-to-fit.mp4
│       └── images/
│           ├── show-all-fields.png
│           ├── show-key-only.png
│           └── show-table-name.png
└── [future packages]/
```

## Versioning Strategy

Assets are versioned by year and month (e.g., `2025-01`) to ensure:
- Backward compatibility with older CLI versions
- Predictable URLs for long-term caching
- Easy rollback if needed

## Local Development

```bash
# Install dependencies
pnpm install

# Build for Vercel
pnpm build
```

## Deployment

This app is automatically deployed to Vercel on push to main branch.

### Production URL
- Base URL: `https://assets.liam-hq.com` (to be configured)
- Example asset: `https://assets.liam-hq.com/erd-core/2025-01/videos/copy-link.mp4`

## Adding New Assets

1. Place files in the appropriate directory under `public/`
2. Use versioned paths (YYYY-MM format)
3. Update the CDN URLs in the consuming packages
4. Deploy to Vercel

## Cache Headers

All assets are served with:
- `Cache-Control: public, max-age=31536000, immutable` (1 year cache)
- CORS headers for cross-origin access

## Related Documentation

- [CDN Migration Plan](../../packages/erd-core/CDN_MIGRATION.md)
- [Vercel Output API](https://vercel.com/docs/build-output-api)