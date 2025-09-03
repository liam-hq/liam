// Asset CDN Configuration
// TODO: Replace with actual CDN URLs when deployed
const CDN_BASE_URL = 'https://assets.liam-hq.com/erd-core/2025-01'

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
