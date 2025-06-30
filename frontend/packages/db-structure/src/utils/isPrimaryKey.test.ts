import { describe, expect, it } from 'vitest'
import type { Constraints } from '../schema/index.js'
import { isPrimaryKey } from './isPrimaryKey.js'

describe('isPrimaryKey', () => {
  describe('positive cases', () => {
    it('should return true when column is part of a single-column PRIMARY KEY constraint', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(true)
    })

    it('should return true when column is part of a composite PRIMARY KEY constraint', () => {
      const constraints: Constraints = {
        pk_composite: {
          type: 'PRIMARY KEY',
          name: 'pk_composite',
          columnName: 'user_id',
        },
      }
      expect(isPrimaryKey('user_id', constraints)).toBe(true)
    })

    it('should return true when column name matches exactly in PRIMARY KEY constraint', () => {
      const constraints: Constraints = {
        pk_exact: {
          type: 'PRIMARY KEY',
          name: 'pk_exact',
          columnName: 'exact_match',
        },
      }
      expect(isPrimaryKey('exact_match', constraints)).toBe(true)
    })
  })

  describe('negative cases', () => {
    it('should return false when column is not part of any PRIMARY KEY constraint', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
      }
      expect(isPrimaryKey('name', constraints)).toBe(false)
    })

    it('should return false when constraints object is empty', () => {
      expect(isPrimaryKey('id', {})).toBe(false)
    })

    it('should return false when column is only part of UNIQUE constraint', () => {
      const constraints: Constraints = {
        uk_email: {
          type: 'UNIQUE',
          name: 'uk_email',
          columnName: 'email',
        },
      }
      expect(isPrimaryKey('email', constraints)).toBe(false)
    })

    it('should return false when column is only part of FOREIGN KEY constraint', () => {
      const constraints: Constraints = {
        fk_user: {
          type: 'FOREIGN KEY',
          name: 'fk_user',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
          updateConstraint: 'CASCADE',
          deleteConstraint: 'CASCADE',
        },
      }
      expect(isPrimaryKey('user_id', constraints)).toBe(false)
    })

    it('should return false when column is only part of CHECK constraint', () => {
      const constraints: Constraints = {
        chk_age: {
          type: 'CHECK',
          name: 'chk_age',
          detail: 'age >= 0',
        },
      }
      expect(isPrimaryKey('age', constraints)).toBe(false)
    })

    it('should return false when no constraints have PRIMARY KEY type', () => {
      const constraints: Constraints = {
        uk_email: {
          type: 'UNIQUE',
          name: 'uk_email',
          columnName: 'email',
        },
        chk_age: {
          type: 'CHECK',
          name: 'chk_age',
          detail: 'age >= 0',
        },
      }
      expect(isPrimaryKey('email', constraints)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle case when columnName is null in constraint', () => {
      const constraints: Constraints = {
        pk_null: {
          type: 'PRIMARY KEY',
          name: 'pk_null',
          columnName: null as any,
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(false)
    })

    it('should handle case when columnName is undefined in constraint', () => {
      const constraints: Constraints = {
        pk_undefined: {
          type: 'PRIMARY KEY',
          name: 'pk_undefined',
          columnName: undefined as any,
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(false)
    })

    it('should handle case-sensitive column name matching', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'ID',
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(false)
      expect(isPrimaryKey('ID', constraints)).toBe(true)
    })

    it('should handle empty columnName string', () => {
      const constraints: Constraints = {
        pk_empty: {
          type: 'PRIMARY KEY',
          name: 'pk_empty',
          columnName: '',
        },
      }
      expect(isPrimaryKey('', constraints)).toBe(true)
      expect(isPrimaryKey('id', constraints)).toBe(false)
    })

    it('should handle special characters in column names', () => {
      const constraints: Constraints = {
        pk_special: {
          type: 'PRIMARY KEY',
          name: 'pk_special',
          columnName: 'user-id_123',
        },
      }
      expect(isPrimaryKey('user-id_123', constraints)).toBe(true)
    })
  })

  describe('multiple constraints scenarios', () => {
    it('should handle multiple constraints with different types correctly', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
        uk_email: {
          type: 'UNIQUE',
          name: 'uk_email',
          columnName: 'email',
        },
        fk_user: {
          type: 'FOREIGN KEY',
          name: 'fk_user',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
          updateConstraint: 'CASCADE',
          deleteConstraint: 'CASCADE',
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(true)
      expect(isPrimaryKey('email', constraints)).toBe(false)
      expect(isPrimaryKey('user_id', constraints)).toBe(false)
    })

    it('should find PRIMARY KEY among multiple constraint types', () => {
      const constraints: Constraints = {
        uk_email: {
          type: 'UNIQUE',
          name: 'uk_email',
          columnName: 'email',
        },
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
        chk_age: {
          type: 'CHECK',
          name: 'chk_age',
          detail: 'age >= 0',
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(true)
    })

    it('should handle multiple PRIMARY KEY constraints (if possible)', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
        pk_uuid: {
          type: 'PRIMARY KEY',
          name: 'pk_uuid',
          columnName: 'uuid',
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(true)
      expect(isPrimaryKey('uuid', constraints)).toBe(true)
    })

    it('should handle constraints with overlapping column names', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
        uk_id: {
          type: 'UNIQUE',
          name: 'uk_id',
          columnName: 'id',
        },
      }
      expect(isPrimaryKey('id', constraints)).toBe(true)
    })
  })

  describe('input validation', () => {
    it('should handle null constraints parameter', () => {
      expect(() => isPrimaryKey('id', null as any)).toThrow()
    })

    it('should handle undefined constraints parameter', () => {
      expect(() => isPrimaryKey('id', undefined as any)).toThrow()
    })

    it('should handle null columnName parameter', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
      }
      expect(isPrimaryKey(null as any, constraints)).toBe(false)
    })

    it('should handle undefined columnName parameter', () => {
      const constraints: Constraints = {
        pk_id: {
          type: 'PRIMARY KEY',
          name: 'pk_id',
          columnName: 'id',
        },
      }
      expect(isPrimaryKey(undefined as any, constraints)).toBe(false)
    })

    it('should handle empty string columnName parameter', () => {
      const constraints: Constraints = {
        pk_empty: {
          type: 'PRIMARY KEY',
          name: 'pk_empty',
          columnName: '',
        },
      }
      expect(isPrimaryKey('', constraints)).toBe(true)
    })
  })
})
