export const PATH_PATTERNS = {
  TABLE_BASE: /^\/tables\/([^/]+)$/,
  TABLE_NAME: /^\/tables\/([^/]+)\/name$/,
  TABLE_COMMENT: /^\/tables\/([^/]+)\/comment$/,
  COLUMN_BASE: /^\/tables\/([^/]+)\/columns\/([^/]+)$/,
  COLUMN_NAME: /^\/tables\/([^/]+)\/columns\/([^/]+)\/name$/,
  COLUMN_COMMENT: /^\/tables\/([^/]+)\/columns\/([^/]+)\/comment$/,
  COLUMN_PRIMARY: /^\/tables\/([^/]+)\/columns\/([^/]+)\/primary$/,
  COLUMN_DEFAULT: /^\/tables\/([^/]+)\/columns\/([^/]+)\/default$/,
  COLUMN_CHECK: /^\/tables\/([^/]+)\/columns\/([^/]+)\/check$/,
  COLUMN_UNIQUE: /^\/tables\/([^/]+)\/columns\/([^/]+)\/unique$/,
  COLUMN_NOT_NULL: /^\/tables\/([^/]+)\/columns\/([^/]+)\/notNull$/,
  INDEX_BASE: /^\/tables\/([^/]+)\/indexes\/([^/]+)$/,
  INDEX_NAME: /^\/tables\/([^/]+)\/indexes\/([^/]+)\/name$/,
  INDEX_UNIQUE: /^\/tables\/([^/]+)\/indexes\/([^/]+)\/unique$/,
  INDEX_COLUMNS: /^\/tables\/([^/]+)\/indexes\/([^/]+)\/columns$/,
  INDEX_TYPE: /^\/tables\/([^/]+)\/indexes\/([^/]+)\/type$/,
  CONSTRAINT_BASE: /^\/tables\/([^/]+)\/constraints\/([^/]+)$/,
  CONSTRAINT_NAME: /^\/tables\/([^/]+)\/constraints\/([^/]+)\/name$/,
  CONSTRAINT_TYPE: /^\/tables\/([^/]+)\/constraints\/([^/]+)\/type$/,
  CONSTRAINT_COLUMN_NAME:
    /^\/tables\/([^/]+)\/constraints\/([^/]+)\/columnName$/,
  CONSTRAINT_TARGET_TABLE_NAME:
    /^\/tables\/([^/]+)\/constraints\/([^/]+)\/targetTableName$/,
  CONSTRAINT_TARGET_COLUMN_NAME:
    /^\/tables\/([^/]+)\/constraints\/([^/]+)\/targetColumnName$/,
  CONSTRAINT_UPDATE_CONSTRAINT:
    /^\/tables\/([^/]+)\/constraints\/([^/]+)\/updateConstraint$/,
  CONSTRAINT_DELETE_CONSTRAINT:
    /^\/tables\/([^/]+)\/constraints\/([^/]+)\/deleteConstraint$/,
  CONSTRAINT_DETAIL: /^\/tables\/([^/]+)\/constraints\/([^/]+)\/detail$/,
} as const
