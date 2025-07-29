const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assistant_role_enum: ['db', 'pm', 'qa'],
      category_enum: [
        'MIGRATION_SAFETY',
        'DATA_INTEGRITY',
        'PERFORMANCE_IMPACT',
        'PROJECT_RULES_CONSISTENCY',
        'SECURITY_OR_SCALABILITY',
      ],
      knowledge_type: ['SCHEMA', 'DOCS'],
      schema_format_enum: ['schemarb', 'postgres', 'prisma', 'tbls'],
      severity_enum: ['CRITICAL', 'WARNING', 'POSITIVE', 'QUESTION'],
      timeline_item_type_enum: [
        'user',
        'assistant',
        'schema_version',
        'error',
        'assistant_log',
        'query_result',
      ],
      workflow_run_status: ['pending', 'success', 'error'],
    },
  },
}
