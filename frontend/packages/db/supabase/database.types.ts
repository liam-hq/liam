export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      github_doc_file_paths: {
        Row: {
          created_at: string
          id: string
          is_review_enabled: boolean
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_review_enabled?: boolean
          path: string
          project_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          is_review_enabled?: boolean
          path?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'github_doc_file_path_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      github_pull_request_comments: {
        Row: {
          created_at: string
          github_comment_identifier: number
          github_pull_request_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          github_comment_identifier: number
          github_pull_request_id: string
          id?: string
          updated_at: string
        }
        Update: {
          created_at?: string
          github_comment_identifier?: number
          github_pull_request_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'github_pull_request_comments_github_pull_request_id_fkey'
            columns: ['github_pull_request_id']
            isOneToOne: true
            referencedRelation: 'github_pull_requests'
            referencedColumns: ['id']
          },
        ]
      }
      github_pull_requests: {
        Row: {
          created_at: string
          id: string
          pull_number: number
          repository_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pull_number: number
          repository_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          pull_number?: number
          repository_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'github_pull_request_repository_id_fkey'
            columns: ['repository_id']
            isOneToOne: false
            referencedRelation: 'github_repositories'
            referencedColumns: ['id']
          },
        ]
      }
      github_repositories: {
        Row: {
          created_at: string
          github_installation_identifier: number
          github_repository_identifier: number
          id: string
          name: string
          organization_id: string
          owner: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          github_installation_identifier: number
          github_repository_identifier: number
          id?: string
          name: string
          organization_id: string
          owner: string
          updated_at: string
        }
        Update: {
          created_at?: string
          github_installation_identifier?: number
          github_repository_identifier?: number
          id?: string
          name?: string
          organization_id?: string
          owner?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'github_repositories_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      invitations: {
        Row: {
          email: string
          id: string
          invite_by_user_id: string
          invited_at: string | null
          organization_id: string
        }
        Insert: {
          email: string
          id?: string
          invite_by_user_id: string
          invited_at?: string | null
          organization_id: string
        }
        Update: {
          email?: string
          id?: string
          invite_by_user_id?: string
          invited_at?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_invite_by_user_id_fkey'
            columns: ['invite_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invitations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      knowledge_suggestion_doc_mappings: {
        Row: {
          created_at: string
          github_doc_file_path_id: string
          id: string
          knowledge_suggestion_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          github_doc_file_path_id: string
          id?: string
          knowledge_suggestion_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          github_doc_file_path_id?: string
          id?: string
          knowledge_suggestion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_suggestion_doc_mapping_github_doc_file_path_id_fkey'
            columns: ['github_doc_file_path_id']
            isOneToOne: false
            referencedRelation: 'github_doc_file_paths'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_suggestion_doc_mapping_knowledge_suggestion_id_fkey'
            columns: ['knowledge_suggestion_id']
            isOneToOne: false
            referencedRelation: 'knowledge_suggestions'
            referencedColumns: ['id']
          },
        ]
      }
      knowledge_suggestions: {
        Row: {
          approved_at: string | null
          branch_name: string
          content: string
          created_at: string
          file_sha: string | null
          id: string
          organization_id: string
          path: string
          project_id: string
          reasoning: string | null
          title: string
          trace_id: string | null
          type: Database['public']['Enums']['knowledge_type']
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          branch_name: string
          content: string
          created_at?: string
          file_sha?: string | null
          id?: string
          organization_id: string
          path: string
          project_id: string
          reasoning?: string | null
          title: string
          trace_id?: string | null
          type: Database['public']['Enums']['knowledge_type']
          updated_at: string
        }
        Update: {
          approved_at?: string | null
          branch_name?: string
          content?: string
          created_at?: string
          file_sha?: string | null
          id?: string
          organization_id?: string
          path?: string
          project_id?: string
          reasoning?: string | null
          title?: string
          trace_id?: string | null
          type?: Database['public']['Enums']['knowledge_type']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_suggestion_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_suggestions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      migration_pull_request_mappings: {
        Row: {
          created_at: string
          id: string
          migration_id: string
          pull_request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          migration_id: string
          pull_request_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          migration_id?: string
          pull_request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'migration_pull_request_mapping_migration_id_fkey'
            columns: ['migration_id']
            isOneToOne: false
            referencedRelation: 'migrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'migration_pull_request_mapping_pull_request_id_fkey'
            columns: ['pull_request_id']
            isOneToOne: false
            referencedRelation: 'github_pull_requests'
            referencedColumns: ['id']
          },
        ]
      }
      migrations: {
        Row: {
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          title: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'migration_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_member_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_member_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      overall_review_knowledge_suggestion_mappings: {
        Row: {
          created_at: string
          id: string
          knowledge_suggestion_id: string
          overall_review_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_suggestion_id: string
          overall_review_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_suggestion_id?: string
          overall_review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'overall_review_knowledge_suggestion_mapping_knowledge_suggestio'
            columns: ['knowledge_suggestion_id']
            isOneToOne: false
            referencedRelation: 'knowledge_suggestions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'overall_review_knowledge_suggestion_mapping_overall_review_id_f'
            columns: ['overall_review_id']
            isOneToOne: false
            referencedRelation: 'overall_reviews'
            referencedColumns: ['id']
          },
        ]
      }
      overall_reviews: {
        Row: {
          branch_name: string
          created_at: string
          id: string
          project_id: string | null
          pull_request_id: string
          review_comment: string | null
          reviewed_at: string
          trace_id: string | null
          updated_at: string
        }
        Insert: {
          branch_name: string
          created_at?: string
          id?: string
          project_id?: string | null
          pull_request_id: string
          review_comment?: string | null
          reviewed_at?: string
          trace_id?: string | null
          updated_at: string
        }
        Update: {
          branch_name?: string
          created_at?: string
          id?: string
          project_id?: string | null
          pull_request_id?: string
          review_comment?: string | null
          reviewed_at?: string
          trace_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'overall_review_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'overall_review_pull_request_id_fkey'
            columns: ['pull_request_id']
            isOneToOne: false
            referencedRelation: 'github_pull_requests'
            referencedColumns: ['id']
          },
        ]
      }
      project_repository_mappings: {
        Row: {
          created_at: string
          id: string
          project_id: string
          repository_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          repository_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          repository_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_repository_mapping_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_repository_mapping_repository_id_fkey'
            columns: ['repository_id']
            isOneToOne: false
            referencedRelation: 'github_repositories'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      review_feedback_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          review_feedback_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          review_feedback_id: string
          updated_at: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          review_feedback_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'review_feedback_comment_review_feedback_id_fkey'
            columns: ['review_feedback_id']
            isOneToOne: false
            referencedRelation: 'review_feedbacks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'review_feedback_comment_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      review_feedback_knowledge_suggestion_mappings: {
        Row: {
          created_at: string
          id: string
          knowledge_suggestion_id: string | null
          review_feedback_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_suggestion_id?: string | null
          review_feedback_id?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_suggestion_id?: string | null
          review_feedback_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'review_feedback_knowledge_suggesti_knowledge_suggestion_id_fkey'
            columns: ['knowledge_suggestion_id']
            isOneToOne: false
            referencedRelation: 'knowledge_suggestions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'review_feedback_knowledge_suggestion_ma_review_feedback_id_fkey'
            columns: ['review_feedback_id']
            isOneToOne: false
            referencedRelation: 'review_feedbacks'
            referencedColumns: ['id']
          },
        ]
      }
      review_feedbacks: {
        Row: {
          category: Database['public']['Enums']['category_enum']
          created_at: string
          description: string
          id: string
          overall_review_id: string
          resolution_comment: string | null
          resolved_at: string | null
          severity: Database['public']['Enums']['severity_enum']
          suggestion: string
          updated_at: string
        }
        Insert: {
          category: Database['public']['Enums']['category_enum']
          created_at?: string
          description: string
          id?: string
          overall_review_id: string
          resolution_comment?: string | null
          resolved_at?: string | null
          severity: Database['public']['Enums']['severity_enum']
          suggestion: string
          updated_at: string
        }
        Update: {
          category?: Database['public']['Enums']['category_enum']
          created_at?: string
          description?: string
          id?: string
          overall_review_id?: string
          resolution_comment?: string | null
          resolved_at?: string | null
          severity?: Database['public']['Enums']['severity_enum']
          suggestion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'review_feedback_overall_review_id_fkey'
            columns: ['overall_review_id']
            isOneToOne: false
            referencedRelation: 'overall_reviews'
            referencedColumns: ['id']
          },
        ]
      }
      review_suggestion_snippets: {
        Row: {
          created_at: string
          filename: string
          id: string
          review_feedback_id: string
          snippet: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          review_feedback_id: string
          snippet: string
          updated_at: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          review_feedback_id?: string
          snippet?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'review_suggestion_snippet_review_feedback_id_fkey'
            columns: ['review_feedback_id']
            isOneToOne: false
            referencedRelation: 'review_feedbacks'
            referencedColumns: ['id']
          },
        ]
      }
      schema_file_paths: {
        Row: {
          created_at: string
          format: Database['public']['Enums']['schema_format_enum']
          id: string
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          format: Database['public']['Enums']['schema_format_enum']
          id?: string
          path: string
          project_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          format?: Database['public']['Enums']['schema_format_enum']
          id?: string
          path?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schema_file_path_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
          name: string
        }
        Insert: {
          email: string
          id: string
          name: string
        }
        Update: {
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      invite_organization_member: {
        Args: {
          p_email: string
          p_organization_id: string
          p_invite_by_user_id: string
        }
        Returns: Json
      }
      sync_existing_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      category_enum:
        | 'MIGRATION_SAFETY'
        | 'DATA_INTEGRITY'
        | 'PERFORMANCE_IMPACT'
        | 'PROJECT_RULES_CONSISTENCY'
        | 'SECURITY_OR_SCALABILITY'
      knowledge_type: 'SCHEMA' | 'DOCS'
      schema_format_enum: 'schemarb' | 'postgres' | 'prisma' | 'tbls'
      severity_enum: 'CRITICAL' | 'WARNING' | 'POSITIVE' | 'QUESTION'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

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
} as const
