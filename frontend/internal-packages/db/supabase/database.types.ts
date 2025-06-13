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
      building_schema_versions: {
        Row: {
          building_schema_id: string
          created_at: string
          id: string
          number: number
          organization_id: string
          patch: Json
          reverse_patch: Json
        }
        Insert: {
          building_schema_id: string
          created_at?: string
          id?: string
          number: number
          organization_id: string
          patch: Json
          reverse_patch: Json
        }
        Update: {
          building_schema_id?: string
          created_at?: string
          id?: string
          number?: number
          organization_id?: string
          patch?: Json
          reverse_patch?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'building_schema_versions_building_schema_id_fkey'
            columns: ['building_schema_id']
            isOneToOne: false
            referencedRelation: 'building_schemas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'building_schema_versions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      building_schemas: {
        Row: {
          created_at: string
          design_session_id: string
          git_sha: string | null
          id: string
          initial_schema_snapshot: Json | null
          organization_id: string
          schema: Json
          schema_file_path: string | null
        }
        Insert: {
          created_at?: string
          design_session_id: string
          git_sha?: string | null
          id?: string
          initial_schema_snapshot?: Json | null
          organization_id: string
          schema: Json
          schema_file_path?: string | null
        }
        Update: {
          created_at?: string
          design_session_id?: string
          git_sha?: string | null
          id?: string
          initial_schema_snapshot?: Json | null
          organization_id?: string
          schema?: Json
          schema_file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'building_schemas_design_session_id_fkey'
            columns: ['design_session_id']
            isOneToOne: true
            referencedRelation: 'design_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'building_schemas_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      design_sessions: {
        Row: {
          created_at: string
          created_by_user_id: string
          id: string
          name: string
          organization_id: string
          parent_design_session_id: string | null
          project_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          id?: string
          name: string
          organization_id: string
          parent_design_session_id?: string | null
          project_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          id?: string
          name?: string
          organization_id?: string
          parent_design_session_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'design_sessions_created_by_user_id_fkey'
            columns: ['created_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'design_sessions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'design_sessions_parent_design_session_id_fkey'
            columns: ['parent_design_session_id']
            isOneToOne: false
            referencedRelation: 'design_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'design_sessions_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      doc_file_paths: {
        Row: {
          created_at: string
          id: string
          is_review_enabled: boolean
          organization_id: string
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_review_enabled?: boolean
          organization_id: string
          path: string
          project_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          is_review_enabled?: boolean
          organization_id?: string
          path?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'doc_file_paths_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'github_doc_file_path_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          updated_at: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          github_comment_identifier: number
          github_pull_request_id: string
          id?: string
          organization_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          github_comment_identifier?: number
          github_pull_request_id?: string
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'github_pull_request_comments_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      github_pull_requests: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          pull_number: number
          repository_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          pull_number: number
          repository_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'github_pull_requests_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
          expired_at: string
          id: string
          invite_by_user_id: string
          invited_at: string | null
          organization_id: string
          token: string
        }
        Insert: {
          email: string
          expired_at?: string
          id?: string
          invite_by_user_id: string
          invited_at?: string | null
          organization_id: string
          token?: string
        }
        Update: {
          email?: string
          expired_at?: string
          id?: string
          invite_by_user_id?: string
          invited_at?: string | null
          organization_id?: string
          token?: string
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
          doc_file_path_id: string
          id: string
          knowledge_suggestion_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_file_path_id: string
          id?: string
          knowledge_suggestion_id: string
          organization_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          doc_file_path_id?: string
          id?: string
          knowledge_suggestion_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_suggestion_doc_mapping_doc_file_path_id_fkey'
            columns: ['doc_file_path_id']
            isOneToOne: false
            referencedRelation: 'doc_file_paths'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_suggestion_doc_mapping_knowledge_suggestion_id_fkey'
            columns: ['knowledge_suggestion_id']
            isOneToOne: false
            referencedRelation: 'knowledge_suggestions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_suggestion_doc_mappings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
      messages: {
        Row: {
          building_schema_version_id: string | null
          content: string
          created_at: string
          design_session_id: string
          id: string
          organization_id: string
          role: Database['public']['Enums']['message_role_enum']
          updated_at: string
          user_id: string | null
        }
        Insert: {
          building_schema_version_id?: string | null
          content: string
          created_at?: string
          design_session_id: string
          id?: string
          organization_id: string
          role: Database['public']['Enums']['message_role_enum']
          updated_at: string
          user_id?: string | null
        }
        Update: {
          building_schema_version_id?: string | null
          content?: string
          created_at?: string
          design_session_id?: string
          id?: string
          organization_id?: string
          role?: Database['public']['Enums']['message_role_enum']
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_building_schema_version_id_fkey'
            columns: ['building_schema_version_id']
            isOneToOne: false
            referencedRelation: 'building_schema_versions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_design_session_id_fkey'
            columns: ['design_session_id']
            isOneToOne: false
            referencedRelation: 'design_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      migration_pull_request_mappings: {
        Row: {
          created_at: string
          id: string
          migration_id: string
          organization_id: string
          pull_request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          migration_id: string
          organization_id: string
          pull_request_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          migration_id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'migration_pull_request_mappings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      migrations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          title: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'migrations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
          organization_id: string
          overall_review_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_suggestion_id: string
          organization_id: string
          overall_review_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_suggestion_id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'overall_review_knowledge_suggestion_mappings_organization_id_fk'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      overall_reviews: {
        Row: {
          branch_name: string
          created_at: string
          id: string
          migration_id: string
          organization_id: string
          review_comment: string | null
          reviewed_at: string
          trace_id: string | null
          updated_at: string
        }
        Insert: {
          branch_name: string
          created_at?: string
          id?: string
          migration_id: string
          organization_id: string
          review_comment?: string | null
          reviewed_at?: string
          trace_id?: string | null
          updated_at: string
        }
        Update: {
          branch_name?: string
          created_at?: string
          id?: string
          migration_id?: string
          organization_id?: string
          review_comment?: string | null
          reviewed_at?: string
          trace_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'overall_review_migration_id_fkey'
            columns: ['migration_id']
            isOneToOne: false
            referencedRelation: 'migrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'overall_reviews_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      project_repository_mappings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          project_id: string
          repository_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          repository_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'project_repository_mappings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
          organization_id: string
          review_feedback_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          organization_id: string
          review_feedback_id: string
          updated_at: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'review_feedback_comments_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      review_feedback_knowledge_suggestion_mappings: {
        Row: {
          created_at: string
          id: string
          knowledge_suggestion_id: string | null
          organization_id: string
          review_feedback_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_suggestion_id?: string | null
          organization_id: string
          review_feedback_id?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_suggestion_id?: string | null
          organization_id?: string
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
          {
            foreignKeyName: 'review_feedback_knowledge_suggestion_mappings_organization_id_f'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
          {
            foreignKeyName: 'review_feedbacks_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      review_suggestion_snippets: {
        Row: {
          created_at: string
          filename: string
          id: string
          organization_id: string
          review_feedback_id: string
          snippet: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          organization_id: string
          review_feedback_id: string
          snippet: string
          updated_at: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'review_suggestion_snippets_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      schema_file_paths: {
        Row: {
          created_at: string
          format: Database['public']['Enums']['schema_format_enum']
          id: string
          organization_id: string
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          format: Database['public']['Enums']['schema_format_enum']
          id?: string
          organization_id: string
          path: string
          project_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          format?: Database['public']['Enums']['schema_format_enum']
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: 'schema_file_paths_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
      accept_invitation: {
        Args: { p_token: string }
        Returns: Json
      }
      add_project: {
        Args: {
          p_project_name: string
          p_repository_name: string
          p_repository_owner: string
          p_installation_id: number
          p_repository_identifier: number
          p_organization_id: string
        }
        Returns: Json
      }
      binary_quantize: {
        Args: { '': string } | { '': unknown }
        Returns: unknown
      }
      get_invitation_data: {
        Args: { p_token: string }
        Returns: Json
      }
      halfvec_avg: {
        Args: { '': number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { '': unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { '': unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { '': unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { '': unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { '': unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { '': unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { '': unknown }
        Returns: unknown
      }
      invite_organization_member: {
        Args: { p_email: string; p_organization_id: string }
        Returns: Json
      }
      is_current_user_org_member: {
        Args: { _org: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { '': unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { '': unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { '': unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { '': unknown } | { '': unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { '': string } | { '': unknown } | { '': unknown }
        Returns: string
      }
      match_documents: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding?: string
          match_threshold?: number
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { '': unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { '': unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { '': unknown[] }
        Returns: number
      }
      sync_existing_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_building_schema: {
        Args:
          | {
              p_schema_id: string
              p_schema_schema: Json
              p_schema_version_patch: Json
              p_schema_version_reverse_patch: Json
              p_latest_schema_version_number: number
            }
          | {
              p_schema_id: string
              p_schema_schema: Json
              p_schema_version_patch: Json
              p_schema_version_reverse_patch: Json
              p_latest_schema_version_number: number
              p_message_content: string
            }
        Returns: Json
      }
      vector_avg: {
        Args: { '': number[] }
        Returns: string
      }
      vector_dims: {
        Args: { '': string } | { '': unknown }
        Returns: number
      }
      vector_norm: {
        Args: { '': string }
        Returns: number
      }
      vector_out: {
        Args: { '': string }
        Returns: unknown
      }
      vector_send: {
        Args: { '': string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { '': unknown[] }
        Returns: number
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
      message_role_enum: 'user' | 'assistant' | 'schema_version'
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
      message_role_enum: ['user', 'assistant', 'schema_version'],
      schema_format_enum: ['schemarb', 'postgres', 'prisma', 'tbls'],
      severity_enum: ['CRITICAL', 'WARNING', 'POSITIVE', 'QUESTION'],
    },
  },
} as const
