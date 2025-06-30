import { describe, expect, it } from 'vitest'
import { convertColumnType } from './convertColumnType.js'

describe('convertColumnType', () => {
  describe('mapped types', () => {
    it('should convert string to varchar', () => {
      expect(convertColumnType('string')).toBe('varchar')
    })

    it('should convert text to text', () => {
      expect(convertColumnType('text')).toBe('text')
    })

    it('should convert integer to integer', () => {
      expect(convertColumnType('integer')).toBe('integer')
    })

    it('should convert bigint to bigint', () => {
      expect(convertColumnType('bigint')).toBe('bigint')
    })

    it('should convert float to float', () => {
      expect(convertColumnType('float')).toBe('float')
    })

    it('should convert decimal to decimal', () => {
      expect(convertColumnType('decimal')).toBe('decimal')
    })

    it('should convert datetime to timestamp', () => {
      expect(convertColumnType('datetime')).toBe('timestamp')
    })

    it('should convert timestamp to timestamp', () => {
      expect(convertColumnType('timestamp')).toBe('timestamp')
    })

    it('should convert timestamptz to timestamptz', () => {
      expect(convertColumnType('timestamptz')).toBe('timestamptz')
    })

    it('should convert time to time', () => {
      expect(convertColumnType('time')).toBe('time')
    })

    it('should convert date to date', () => {
      expect(convertColumnType('date')).toBe('date')
    })

    it('should convert binary to bytea', () => {
      expect(convertColumnType('binary')).toBe('bytea')
    })

    it('should convert boolean to boolean', () => {
      expect(convertColumnType('boolean')).toBe('boolean')
    })

    it('should convert json to json', () => {
      expect(convertColumnType('json')).toBe('json')
    })

    it('should convert jsonb to jsonb', () => {
      expect(convertColumnType('jsonb')).toBe('jsonb')
    })

    it('should convert uuid to uuid', () => {
      expect(convertColumnType('uuid')).toBe('uuid')
    })
  })

  describe('range types', () => {
    it('should convert daterange to daterange', () => {
      expect(convertColumnType('daterange')).toBe('daterange')
    })

    it('should convert numrange to numrange', () => {
      expect(convertColumnType('numrange')).toBe('numrange')
    })

    it('should convert tsrange to tsrange', () => {
      expect(convertColumnType('tsrange')).toBe('tsrange')
    })

    it('should convert tstzrange to tstzrange', () => {
      expect(convertColumnType('tstzrange')).toBe('tstzrange')
    })

    it('should convert int4range to int4range', () => {
      expect(convertColumnType('int4range')).toBe('int4range')
    })

    it('should convert int8range to int8range', () => {
      expect(convertColumnType('int8range')).toBe('int8range')
    })
  })

  describe('PostgreSQL specific types', () => {
    it('should convert xml to xml', () => {
      expect(convertColumnType('xml')).toBe('xml')
    })

    it('should convert tsvector to tsvector', () => {
      expect(convertColumnType('tsvector')).toBe('tsvector')
    })

    it('should convert hstore to hstore', () => {
      expect(convertColumnType('hstore')).toBe('hstore')
    })

    it('should convert inet to inet', () => {
      expect(convertColumnType('inet')).toBe('inet')
    })

    it('should convert cidr to cidr', () => {
      expect(convertColumnType('cidr')).toBe('cidr')
    })

    it('should convert macaddr to macaddr', () => {
      expect(convertColumnType('macaddr')).toBe('macaddr')
    })

    it('should convert ltree to ltree', () => {
      expect(convertColumnType('ltree')).toBe('ltree')
    })

    it('should convert citext to citext', () => {
      expect(convertColumnType('citext')).toBe('citext')
    })

    it('should convert money to money', () => {
      expect(convertColumnType('money')).toBe('money')
    })

    it('should convert interval to interval', () => {
      expect(convertColumnType('interval')).toBe('interval')
    })

    it('should convert oid to oid', () => {
      expect(convertColumnType('oid')).toBe('oid')
    })
  })

  describe('geometric types', () => {
    it('should convert point to point', () => {
      expect(convertColumnType('point')).toBe('point')
    })

    it('should convert line to line', () => {
      expect(convertColumnType('line')).toBe('line')
    })

    it('should convert lseg to lseg', () => {
      expect(convertColumnType('lseg')).toBe('lseg')
    })

    it('should convert box to box', () => {
      expect(convertColumnType('box')).toBe('box')
    })

    it('should convert path to path', () => {
      expect(convertColumnType('path')).toBe('path')
    })

    it('should convert polygon to polygon', () => {
      expect(convertColumnType('polygon')).toBe('polygon')
    })

    it('should convert circle to circle', () => {
      expect(convertColumnType('circle')).toBe('circle')
    })
  })

  describe('bit types', () => {
    it('should convert bit to bit', () => {
      expect(convertColumnType('bit')).toBe('bit')
    })

    it('should convert bit_varying to bit varying', () => {
      expect(convertColumnType('bit_varying')).toBe('bit varying')
    })
  })

  describe('unmapped types', () => {
    it('should return unmapped type as-is', () => {
      expect(convertColumnType('custom_type')).toBe('custom_type')
    })

    it('should handle custom types by returning them unchanged', () => {
      expect(convertColumnType('my_enum')).toBe('my_enum')
    })

    it('should handle array types by returning them unchanged', () => {
      expect(convertColumnType('text[]')).toBe('text[]')
    })

    it('should handle composite types by returning them unchanged', () => {
      expect(convertColumnType('address_type')).toBe('address_type')
    })

    it('should handle types with modifiers by returning them unchanged', () => {
      expect(convertColumnType('varchar(255)')).toBe('varchar(255)')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string input', () => {
      expect(convertColumnType('')).toBe('')
    })

    it('should handle null/undefined gracefully', () => {
      expect(convertColumnType(null as any)).toBe(null)
      expect(convertColumnType(undefined as any)).toBe(undefined)
    })

    it('should handle type names with different casing', () => {
      expect(convertColumnType('STRING')).toBe('STRING')
      expect(convertColumnType('String')).toBe('String')
    })

    it('should handle type names with spaces', () => {
      expect(convertColumnType('custom type')).toBe('custom type')
    })

    it('should handle type names with special characters', () => {
      expect(convertColumnType('type-with_special.chars')).toBe(
        'type-with_special.chars',
      )
    })

    it('should handle numeric type names', () => {
      expect(convertColumnType('123')).toBe('123')
    })
  })

  describe('Rails/PostgreSQL compatibility', () => {
    it('should align with Rails PostgreSQL adapter mappings', () => {
      expect(convertColumnType('string')).toBe('varchar')
      expect(convertColumnType('datetime')).toBe('timestamp')
      expect(convertColumnType('binary')).toBe('bytea')
    })

    it('should handle types that Rails maps differently', () => {
      expect(convertColumnType('bit_varying')).toBe('bit varying')
      expect(convertColumnType('datetime')).toBe('timestamp')
    })
  })
})
