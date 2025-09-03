// Asset CDN Configuration
// TODO: Replace with actual CDN URL when deployed to Vercel
// Development: http://localhost:3000 (if running locally)
// Production: https://liam-assets.vercel.app or custom domain
const CDN_BASE_URL = 'https://liam-assets.vercel.app/erd-core/2025-09'

export const ASSET_URLS = {
  videos: {
    copyLink: `${CDN_BASE_URL}/videos/copy-link.mp4`,
    zoomToFit: `${CDN_BASE_URL}/videos/zoom-to-fit.mp4`,
    tidyUp: `${CDN_BASE_URL}/videos/tidy-up.mp4`,
  },
  images: {
    showAllFields: `${CDN_BASE_URL}/images/show-all-fields.png`,
    showKeyOnly: `${CDN_BASE_URL}/images/show-key-only.png`,
    showTableName: `${CDN_BASE_URL}/images/show-table-name.png`,
  },
} as const
