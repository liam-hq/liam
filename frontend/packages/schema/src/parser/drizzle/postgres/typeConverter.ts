import type { DatabaseTypeConverter } from '../shared/types.js'
import {
  convertDefaultValue,
  convertDrizzleTypeToPgType,
  convertReferenceOption,
} from './convertToPgType.js'

export class PostgreSQLTypeConverter implements DatabaseTypeConverter {
  convertDrizzleType(
    drizzleType: string,
    options?: Record<string, unknown>,
  ): string {
    return convertDrizzleTypeToPgType(drizzleType, options)
  }

  convertDefaultValue(
    value: unknown,
    drizzleType: string,
  ): string | number | boolean | null {
    return convertDefaultValue(value, drizzleType)
  }

  convertReferenceOption(
    option: string,
  ): 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'SET_DEFAULT' | 'NO_ACTION' {
    return convertReferenceOption(option)
  }
}
