import type { Tables } from '../../supabase/database.types'

export const aBuildingSchemaVersion =
  (): Tables<'building_schema_versions'> => {
    return {
      id: 'building-schema-version-id',
      organization_id: 'organization-id',
      building_schema_id: 'building-schema-id',
      number: 1,
      patch: [
        {
          op: 'add',
          path: '/tables/users/columns/email',
          value: {
            name: 'email',
            type: 'text',
            check: null,
            comment: 'User email address',
            default: null,
            notNull: true,
          },
        },
        {
          op: 'replace',
          path: '/tables/posts/columns/title',
          value: {
            name: 'title',
            type: 'text',
            check: null,
            comment: 'Post title',
            default: null,
            notNull: true,
          },
        },
        {
          op: 'remove',
          path: '/tables/comments',
        },
        {
          op: 'move',
          from: '/tables/archive',
          path: '/tables/archive_moved',
        },
        {
          op: 'copy',
          from: '/tables/original',
          path: '/tables/new_copy',
        },
        {
          op: 'test',
          path: '/tables/test_table',
          value: {
            name: 'test_table',
            columns: {},
            comment: 'Test table',
            indexes: {},
            constraints: {},
          },
        },
      ],
      reverse_patch: [],
      created_at: '2025-07-17 05:21:15.59056+00',
    }
  }
