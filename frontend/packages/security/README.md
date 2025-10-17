# @liam-hq/security

Security utilities for application-layer token handling.

- Third-party tokens only: AES-256-GCM encryption with per-row IV and `key_id` for rotation. Encrypt/decrypt return `Result`.

Env variables (server-only):

- `TOKEN_PEPPER`: secret pepper used in hashing (store in Vault/KMS).
- `KEYRING`: comma-separated `kid:base64key` entries; first is current key.

Exports:

- `cryptoBox`: `encryptAesGcm` (Result), `decryptAesGcm` (Result), `currentKey` (Result), `setKeyring`

See also:
- `docs/security/token-storage.md`
- `frontend/packages/security/KEY_ROTATION.md`
