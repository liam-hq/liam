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
      Doc: {
        Row: {
          content: string
          createdAt: string
          id: number
          latestVersionId: number | null
          projectId: number
          title: string
          updatedAt: string
        }
        Insert: {
          content: string
          createdAt?: string
          id?: number
          latestVersionId?: number | null
          projectId: number
          title: string
          updatedAt: string
        }
        Update: {
          content?: string
          createdAt?: string
          id?: number
          latestVersionId?: number | null
          projectId?: number
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Doc_projectId_fkey'
            columns: ['projectId']
            isOneToOne: false
            referencedRelation: 'Project'
            referencedColumns: ['id']
          },
        ]
      }
      DocVersion: {
        Row: {
          content: string
          createdAt: string
          docId: number
          id: number
          title: string
          version: number
        }
        Insert: {
          content: string
          createdAt?: string
          docId: number
          id?: number
          title: string
          version: number
        }
        Update: {
          content?: string
          createdAt?: string
          docId?: number
          id?: number
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'DocVersion_docId_fkey'
            columns: ['docId']
            isOneToOne: false
            referencedRelation: 'Doc'
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
          createdAt: string
          id: number
          projectId: number | null
          pullRequestId: number
          reviewComment: string | null
          reviewedAt: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          projectId?: number | null
          pullRequestId: number
          reviewComment?: string | null
          reviewedAt?: string
          updatedAt: string
        }
        Update: {
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
      WatchSchemaFilePattern: {
        Row: {
          createdAt: string
          id: number
          pattern: string
          projectId: number
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          pattern: string
          projectId: number
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: number
          pattern?: string
          projectId?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'WatchSchemaFilePattern_projectId_fkey'
            columns: ['projectId']
            isOneToOne: false
            referencedRelation: 'Project'
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
      [_ in never]: never
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
