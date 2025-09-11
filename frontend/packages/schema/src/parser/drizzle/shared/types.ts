/**
 * Shared types and interfaces for Drizzle parser refactoring
 */

export type DatabaseTypeConverter = {
  convertDrizzleType(
    drizzleType: string,
    options?: Record<string, unknown>,
  ): string
  convertDefaultValue(
    value: unknown,
    drizzleType: string,
  ): string | number | boolean | null
  convertReferenceOption(
    option: string,
  ): 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'SET_DEFAULT' | 'NO_ACTION'
}

export type DatabaseSpecificConfig = {
  typeConverter: DatabaseTypeConverter
  supportsInlineEnums: boolean
  supportsCheckConstraints: boolean
  supportsMySQLSpecificMethods: boolean
}
