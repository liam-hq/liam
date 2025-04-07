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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      GitHubDocFilePath: {
        Row: {
          createdAt: string
          id: number
          isReviewEnabled: boolean
          path: string
          projectId: number
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          isReviewEnabled?: boolean
          path: string
          projectId: number
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: number
          isReviewEnabled?: boolean
          path?: string
          projectId?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'GitHubDocFilePath_projectId_fkey'
            columns: ['projectId']
            isOneToOne: false
            referencedRelation: 'Project'
            referencedColumns: ['id']
          },
        ]
      }
      GitHubSchemaFilePath: {
        Row: {
          createdAt: string
          id: number
          path: string
          projectId: number
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          path: string
          projectId: number
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: number
          path?: string
          projectId?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'GitHubSchemaFilePath_projectId_fkey'
            columns: ['projectId']
            isOneToOne: false
            referencedRelation: 'Project'
            referencedColumns: ['id']
          },
        ]
      }
      KnowledgeSuggestion: {
        Row: {
          approvedAt: string | null
          branchName: string
          content: string
          createdAt: string
          fileSha: string | null
          id: number
          path: string
          projectId: number
          title: string
          type: Database['public']['Enums']['KnowledgeType']
          updatedAt: string
        }
        Insert: {
          approvedAt?: string | null
          branchName: string
          content: string
          createdAt?: string
          fileSha?: string | null
          id?: number
          path: string
          projectId: number
          title: string
          type: Database['public']['Enums']['KnowledgeType']
          updatedAt: string
        }
        Update: {
          approvedAt?: string | null
          branchName?: string
          content?: string
          createdAt?: string
          fileSha?: string | null
          id?: number
          path?: string
          projectId?: number
          title?: string
          type?: Database['public']['Enums']['KnowledgeType']
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'KnowledgeSuggestion_projectId_fkey'
            columns: ['projectId']
            isOneToOne: false
            referencedRelation: 'Project'
            referencedColumns: ['id']
          },
        ]
      }
      Migration: {
        Row: {
          createdAt: string
          id: number
          pullRequestId: number
          title: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          pullRequestId: number
          title: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: number
          pullRequestId?: number
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Migration_pullRequestId_fkey'
            columns: ['pullRequestId']
            isOneToOne: false
            referencedRelation: 'PullRequest'
            referencedColumns: ['id']
          },
        ]
      }
      OverallReview: {
        Row: {
          branchName: string
          createdAt: string
          id: number
          projectId: number | null
          pullRequestId: number
          reviewComment: string | null
          reviewedAt: string
          updatedAt: string
        }
        Insert: {
          branchName: string
          createdAt?: string
          id?: number
          projectId?: number | null
          pullRequestId: number
          reviewComment?: string | null
          reviewedAt?: string
          updatedAt: string
        }
        Update: {
          branchName?: string
          createdAt?: string
          id?: number
          projectId?: number | null
          pullRequestId?: number
          reviewComment?: string | null
          reviewedAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'OverallReview_projectId_fkey'
            columns: ['projectId']
            isOneToOne: false
            referencedRelation: 'Project'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'OverallReview_pullRequestId_fkey'
            columns: ['pullRequestId']
            isOneToOne: false
            referencedRelation: 'PullRequest'
            referencedColumns: ['id']
          },
        ]
      }
      Project: {
        Row: {
          createdAt: string
          id: number
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          name: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: number
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      ProjectRepositoryMapping: {
        Row: {
          createdAt: string
          id: number
          projectId: number
          repositoryId: number
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          projectId: number
          repositoryId: number
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: number
          projectId?: number
          repositoryId?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ProjectRepositoryMapping_projectId_fkey'
            columns: ['projectId']
            isOneToOne: false
            referencedRelation: 'Project'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ProjectRepositoryMapping_repositoryId_fkey'
            columns: ['repositoryId']
            isOneToOne: false
            referencedRelation: 'Repository'
            referencedColumns: ['id']
          },
        ]
      }
      PullRequest: {
        Row: {
          commentId: number | null
          createdAt: string
          id: number
          pullNumber: number
          repositoryId: number
          updatedAt: string
        }
        Insert: {
          commentId?: number | null
          createdAt?: string
          id?: number
          pullNumber: number
          repositoryId: number
          updatedAt: string
        }
        Update: {
          commentId?: number | null
          createdAt?: string
          id?: number
          pullNumber?: number
          repositoryId?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'PullRequest_repositoryId_fkey'
            columns: ['repositoryId']
            isOneToOne: false
            referencedRelation: 'Repository'
            referencedColumns: ['id']
          },
        ]
      }
      Repository: {
        Row: {
          createdAt: string
          id: number
          installationId: number
          isActive: boolean
          name: string
          owner: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          installationId: number
          isActive?: boolean
          name: string
          owner: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: number
          installationId?: number
          isActive?: boolean
          name?: string
          owner?: string
          updatedAt?: string
        }
        Relationships: []
      }
      ReviewIssue: {
        Row: {
          category: Database['public']['Enums']['CategoryEnum']
          createdAt: string
          description: string
          id: number
          overallReviewId: number
          overallScore: number
          severity: Database['public']['Enums']['SeverityEnum']
          updatedAt: string
        }
        Insert: {
          category: Database['public']['Enums']['CategoryEnum']
          createdAt?: string
          description: string
          id?: number
          overallReviewId: number
          overallScore: number
          severity: Database['public']['Enums']['SeverityEnum']
          updatedAt: string
        }
        Update: {
          category?: Database['public']['Enums']['CategoryEnum']
          createdAt?: string
          description?: string
          id?: number
          overallReviewId?: number
          overallScore?: number
          severity?: Database['public']['Enums']['SeverityEnum']
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ReviewIssue_overallReviewId_fkey'
            columns: ['overallReviewId']
            isOneToOne: false
            referencedRelation: 'OverallReview'
            referencedColumns: ['id']
          },
        ]
      }
      ReviewScore: {
        Row: {
          category: Database['public']['Enums']['CategoryEnum']
          createdAt: string
          id: number
          overallReviewId: number
          overallScore: number
          reason: string
          updatedAt: string
        }
        Insert: {
          category: Database['public']['Enums']['CategoryEnum']
          createdAt?: string
          id?: number
          overallReviewId: number
          overallScore: number
          reason: string
          updatedAt: string
        }
        Update: {
          category?: Database['public']['Enums']['CategoryEnum']
          createdAt?: string
          id?: number
          overallReviewId?: number
          overallScore?: number
          reason?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ReviewScore_overallReviewId_fkey'
            columns: ['overallReviewId']
            isOneToOne: false
            referencedRelation: 'OverallReview'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      CategoryEnum:
        | 'MIGRATION_SAFETY'
        | 'DATA_INTEGRITY'
        | 'PERFORMANCE_IMPACT'
        | 'PROJECT_RULES_CONSISTENCY'
        | 'SECURITY_OR_SCALABILITY'
      KnowledgeType: 'SCHEMA' | 'DOCS'
      SeverityEnum: 'CRITICAL' | 'WARNING' | 'POSITIVE'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
