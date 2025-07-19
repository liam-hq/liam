export const schemaJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    tables: {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        '^[a-zA-Z_][a-zA-Z0-9_]*$': {
          type: 'object',
          required: ['name', 'columns', 'comment', 'indexes', 'constraints'],
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            columns: {
              type: 'object',
              patternProperties: {
                '^[a-zA-Z_][a-zA-Z0-9_]*$': {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    default: { type: ['string', 'number', 'null'] },
                    check: { type: ['string', 'null'] },
                    notNull: { type: 'boolean' },
                    comment: { type: ['string', 'null'] },
                  },
                  required: [
                    'name',
                    'type',
                    'default',
                    'check',
                    'notNull',
                    'comment',
                  ],
                  additionalProperties: false,
                },
              },
            },
            comment: { type: ['string', 'null'] },
            indexes: {
              type: 'object',
              additionalProperties: false,
            },
            constraints: {
              type: 'object',
              patternProperties: {
                '^[a-zA-Z_][a-zA-Z0-9_]*$': {
                  type: 'object',
                  anyOf: [
                    {
                      properties: {
                        type: { const: 'PRIMARY KEY' },
                        name: { type: 'string' },
                        columnNames: {
                          type: 'array',
                          items: { type: 'string' },
                          minItems: 1,
                        },
                      },
                      required: ['type', 'name', 'columnNames'],
                      additionalProperties: false,
                    },
                    {
                      properties: {
                        type: { const: 'FOREIGN KEY' },
                        name: { type: 'string' },
                        columnNames: {
                          type: 'array',
                          items: { type: 'string' },
                          minItems: 1,
                        },
                        targetTableName: { type: 'string' },
                        targetColumnNames: {
                          type: 'array',
                          items: { type: 'string' },
                          minItems: 1,
                        },
                        updateConstraint: {
                          type: 'string',
                          enum: [
                            'CASCADE',
                            'RESTRICT',
                            'SET_NULL',
                            'SET_DEFAULT',
                            'NO_ACTION',
                          ],
                        },
                        deleteConstraint: {
                          type: 'string',
                          enum: [
                            'CASCADE',
                            'RESTRICT',
                            'SET_NULL',
                            'SET_DEFAULT',
                            'NO_ACTION',
                          ],
                        },
                      },
                      required: [
                        'type',
                        'name',
                        'columnNames',
                        'targetTableName',
                        'targetColumnNames',
                        'updateConstraint',
                        'deleteConstraint',
                      ],
                      additionalProperties: false,
                    },
                    {
                      properties: {
                        type: { const: 'UNIQUE' },
                        name: { type: 'string' },
                        columnNames: {
                          type: 'array',
                          items: { type: 'string' },
                          minItems: 1,
                        },
                      },
                      required: ['type', 'name', 'columnNames'],
                      additionalProperties: false,
                    },
                    {
                      properties: {
                        type: { const: 'CHECK' },
                        name: { type: 'string' },
                        detail: { type: 'string' },
                      },
                      required: ['type', 'name', 'detail'],
                      additionalProperties: false,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
} as const
