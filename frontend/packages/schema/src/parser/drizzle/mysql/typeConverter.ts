import type { DatabaseTypeConverter } from '../shared/types.js'
import {
  convertDefaultValue,
  convertDrizzleTypeToMysqlType,
  convertReferenceOption,
} from './convertToMysqlType.js'

export class MySQLTypeConverter implements DatabaseTypeConverter {
  convertDrizzleType(
    drizzleType: string,
    options?: Record<string, unknown>,
  ): string {
    return convertDrizzleTypeToMysqlType(drizzleType, options)
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
