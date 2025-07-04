/**
 * Relation definition parsing for Drizzle ORM schema parsing
 */

import type { CallExpression } from '@swc/core'
import {
  getSafeArrayValue,
  getSafeRelationType,
  getSafeStringValue,
} from './ast-utils.js'
import type { DrizzleRelationDefinition } from './types.js'
import { getPropertyValue, hasProperty } from './types.js'

/**
 * Parse relations call expression
 */
export const parseRelationsCall = (
  callExpr: unknown,
): DrizzleRelationDefinition[] => {
  // Type guard for CallExpression
  if (
    typeof callExpr !== 'object' ||
    callExpr === null ||
    !('arguments' in callExpr)
  ) {
    return []
  }

  const expr = callExpr as CallExpression
  const relations: DrizzleRelationDefinition[] = []

  if (expr.arguments.length < 2) {
    return relations
  }

  // First argument should be the table reference
  const tableArg = expr.arguments[0]
  let fromTableName = ''

  // Handle ExpressionOrSpread structure
  const tableExpr = hasProperty(tableArg, 'expression')
    ? getPropertyValue(tableArg, 'expression')
    : tableArg

  if (
    hasProperty(tableExpr, 'type') &&
    getPropertyValue(tableExpr, 'type') === 'Identifier'
  ) {
    fromTableName = getSafeStringValue(getPropertyValue(tableExpr, 'value'))
  }

  // Second argument should be the arrow function with relations definition
  const relationsFnArg = expr.arguments[1]
  const relationsFn = hasProperty(relationsFnArg, 'expression')
    ? getPropertyValue(relationsFnArg, 'expression')
    : relationsFnArg
  if (
    !hasProperty(relationsFn, 'type') ||
    getPropertyValue(relationsFn, 'type') !== 'ArrowFunctionExpression'
  ) {
    return relations
  }

  let body = getPropertyValue(relationsFn, 'body')

  // Handle ParenthesisExpression: ({ ... }) -> { ... }
  if (
    hasProperty(body, 'type') &&
    getPropertyValue(body, 'type') === 'ParenthesisExpression'
  ) {
    body = getPropertyValue(body, 'expression')
  }

  if (
    !hasProperty(body, 'type') ||
    getPropertyValue(body, 'type') !== 'ObjectExpression'
  ) {
    return relations
  }

  const properties = getSafeArrayValue(getPropertyValue(body, 'properties'))
  if (properties.length === 0) {
    return relations
  }

  // Parse each relation property
  for (const prop of properties) {
    const propType = getPropertyValue(prop, 'type')
    if (
      !hasProperty(prop, 'type') ||
      (propType !== 'Property' && propType !== 'KeyValueProperty')
    ) {
      continue
    }

    const value = getPropertyValue(prop, 'value')
    if (
      !hasProperty(value, 'type') ||
      getPropertyValue(value, 'type') !== 'CallExpression'
    ) {
      continue
    }

    const callee = getPropertyValue(value, 'callee')
    if (
      !hasProperty(callee, 'type') ||
      getPropertyValue(callee, 'type') !== 'Identifier'
    ) {
      continue
    }

    const relationType = getSafeStringValue(getPropertyValue(callee, 'value'))
    if (relationType !== 'one' && relationType !== 'many') {
      continue
    }

    const args = getSafeArrayValue(getPropertyValue(value, 'arguments'))
    if (args.length < 1) {
      continue
    }

    // First argument is the target table
    const targetTableArg = args[0]
    const targetTableExpr = hasProperty(targetTableArg, 'expression')
      ? getPropertyValue(targetTableArg, 'expression')
      : targetTableArg
    let toTableName = ''

    if (
      hasProperty(targetTableExpr, 'type') &&
      getPropertyValue(targetTableExpr, 'type') === 'Identifier'
    ) {
      toTableName = getSafeStringValue(
        getPropertyValue(targetTableExpr, 'value'),
      )
    }

    // Second argument (if exists) is the configuration object
    let fields: string[] = []
    let references: string[] = []

    if (args.length > 1) {
      const configArg = args[1]
      const configExpr = hasProperty(configArg, 'expression')
        ? getPropertyValue(configArg, 'expression')
        : configArg
      if (
        hasProperty(configExpr, 'type') &&
        getPropertyValue(configExpr, 'type') === 'ObjectExpression'
      ) {
        const configProps = getSafeArrayValue(
          getPropertyValue(configExpr, 'properties'),
        )
        if (configProps.length > 0) {
          for (const configProp of configProps) {
            const configPropType = getPropertyValue(configProp, 'type')
            if (
              !hasProperty(configProp, 'type') ||
              (configPropType !== 'Property' &&
                configPropType !== 'KeyValueProperty')
            ) {
              continue
            }

            const key = getPropertyValue(configProp, 'key')
            const keyName = getSafeStringValue(getPropertyValue(key, 'value'))

            const propValue = getPropertyValue(configProp, 'value')

            if (keyName === 'fields' || keyName === 'references') {
              if (
                hasProperty(propValue, 'type') &&
                getPropertyValue(propValue, 'type') === 'ArrayExpression'
              ) {
                const elements = getSafeArrayValue(
                  getPropertyValue(propValue, 'elements'),
                )
                if (elements.length > 0) {
                  const fieldNames: string[] = []
                  for (const element of elements) {
                    // Handle ExpressionOrSpread structure
                    const elementExpr = hasProperty(element, 'expression')
                      ? getPropertyValue(element, 'expression')
                      : element

                    if (
                      hasProperty(elementExpr, 'type') &&
                      getPropertyValue(elementExpr, 'type') ===
                        'MemberExpression'
                    ) {
                      const property = getPropertyValue(elementExpr, 'property')
                      if (hasProperty(property, 'value')) {
                        const fieldName = getSafeStringValue(
                          getPropertyValue(property, 'value'),
                        )
                        if (fieldName) {
                          fieldNames.push(fieldName)
                        }
                      }
                    }
                  }

                  if (keyName === 'fields') {
                    fields = fieldNames
                  } else {
                    references = fieldNames
                  }
                }
              }
            }
          }
        }
      }
    }

    if (fromTableName && toTableName) {
      const relation: DrizzleRelationDefinition = {
        fromTable: fromTableName,
        toTable: toTableName,
        type: getSafeRelationType(relationType),
      }

      if (fields.length > 0) {
        relation.fields = fields
      }

      if (references.length > 0) {
        relation.references = references
      }

      relations.push(relation)
    }
  }

  return relations
}
