# CDN Migration for ERD Core Assets

## Overview
This change migrates static assets (videos and images) from being bundled within the CLI to being served from an external CDN.

## Changes Made

### 1. Asset URL Configuration
Created `/frontend/packages/erd-core/src/config/assetUrls.ts`:
- Centralized configuration for all CDN asset URLs
- Uses versioned path structure (e.g., `/2025-09/`) for backward compatibility
- Temporary placeholder URL: `https://assets.liambx.com/erd-core/`

### 2. Component Updates
Modified `/frontend/packages/erd-core/src/features/erd/components/ERDRenderer/CommandPalette/CommandPalettePreview/CommandPreview.tsx`:
- Removed local asset imports
- Now uses CDN URLs from the configuration file
- Simplified image handling (removed `StaticImageData` type)

### 3. Assets to be Hosted on CDN
The following files need to be uploaded to the CDN:
- `videos/copy-link.mp4`
- `videos/zoom-to-fit.mp4`
- `videos/tidy-up.mp4`
- `images/show-all-fields.png`
- `images/show-key-only.png`
- `images/show-table-name.png`

## Benefits
- **Reduced CLI bundle size**: Assets are no longer included in the npm package
- **Faster installation**: Smaller package size means faster npm installs
- **Version flexibility**: Can update assets without releasing new CLI versions
- **Better caching**: CDN provides efficient caching and distribution

## Next Steps
1. Deploy assets to Vercel static hosting (as discussed in issue #5562)
2. Set up proper CDN domain (e.g., `assets.liambx.com`)
3. Update the `CDN_BASE_URL` in `assetUrls.ts` with the actual URL
4. Consider implementing fallback mechanism for offline usage (future enhancement)

## Testing
Tests continue to pass as they only verify element presence, not actual asset URLs:
```bash
cd frontend/packages/erd-core && pnpm test CommandPreview.test.tsx
```