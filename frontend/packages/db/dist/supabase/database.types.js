export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
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
        },
    },
};
