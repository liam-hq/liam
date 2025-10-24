# Internal Security Utilities

This module contains internal security utilities used by the app for token encryption.

- Keyring env: `LIAM_GITHUB_OAUTH_KEYRING` — comma-separated `kid:base64key` (first is current)
- Crypto: AES-256-GCM with per-message IV and `key_id` for rotation

For usage examples, see `frontend/apps/app/libs/github/cookie.ts`.

