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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
          patch: Json | null
          reverse_patch: Json | null
        }
        Insert: {
          building_schema_id: string
          created_at?: string
          id?: string
          number: number
          organization_id: string
          patch?: Json | null
          reverse_patch?: Json | null
        }
        Update: {
          building_schema_id?: string
          created_at?: string
          id?: string
          number?: number
          organization_id?: string
          patch?: Json | null
          reverse_patch?: Json | null
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
      checkpoint_blobs: {
        Row: {
          blob: string | null
          channel: string
          checkpoint_ns: string
          created_at: string | null
          id: string
          organization_id: string
          thread_id: string
          type: string
          version: string
        }
        Insert: {
          blob?: string | null
          channel: string
          checkpoint_ns?: string
          created_at?: string | null
          id?: string
          organization_id: string
          thread_id: string
          type: string
          version: string
        }
        Update: {
          blob?: string | null
          channel?: string
          checkpoint_ns?: string
          created_at?: string | null
          id?: string
          organization_id?: string
          thread_id?: string
          type?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 'checkpoint_blobs_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      checkpoint_writes: {
        Row: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns: string
          created_at: string | null
          id: string
          idx: number
          organization_id: string
          task_id: string
          thread_id: string
          type: string | null
        }
        Insert: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns?: string
          created_at?: string | null
          id?: string
          idx: number
          organization_id: string
          task_id: string
          thread_id: string
          type?: string | null
        }
        Update: {
          blob?: string
          channel?: string
          checkpoint_id?: string
          checkpoint_ns?: string
          created_at?: string | null
          id?: string
          idx?: number
          organization_id?: string
          task_id?: string
          thread_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'checkpoint_writes_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      checkpoints: {
        Row: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns: string
          created_at: string | null
          id: string
          metadata: Json
          organization_id: string
          parent_checkpoint_id: string | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns?: string
          created_at?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          parent_checkpoint_id?: string | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          checkpoint?: Json
          checkpoint_id?: string
          checkpoint_ns?: string
          created_at?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          parent_checkpoint_id?: string | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'checkpoints_organization_id_fkey'
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
          finished_at: string | null
          id: string
          name: string
          organization_id: string
          parent_design_session_id: string | null
          project_id: string | null
          started_at: string | null
          status: Database['public']['Enums']['workflow_status']
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          finished_at?: string | null
          id?: string
          name: string
          organization_id: string
          parent_design_session_id?: string | null
          project_id?: string | null
          started_at?: string | null
          status?: Database['public']['Enums']['workflow_status']
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          finished_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_design_session_id?: string | null
          project_id?: string | null
          started_at?: string | null
          status?: Database['public']['Enums']['workflow_status']
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
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
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
      public_share_settings: {
        Row: {
          created_at: string
          design_session_id: string
        }
        Insert: {
          created_at?: string
          design_session_id: string
        }
        Update: {
          created_at?: string
          design_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_share_settings_design_session_id_fkey'
            columns: ['design_session_id']
            isOneToOne: true
            referencedRelation: 'design_sessions'
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
          avatar_url: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          email: string
          id: string
          name: string
        }
        Update: {
          avatar_url?: string | null
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
          p_installation_id: number
          p_organization_id: string
          p_project_name: string
          p_repository_identifier: number
          p_repository_name: string
          p_repository_owner: string
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
      put_checkpoint: {
        Args: { p_blobs: Json; p_checkpoint: Json }
        Returns: undefined
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
        Args: {
          p_latest_schema_version_number: number
          p_message_content: string
          p_schema_id: string
          p_schema_schema: Json
          p_schema_version_patch: Json
          p_schema_version_reverse_patch: Json
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
      assistant_role_enum: 'db' | 'pm' | 'qa'
      schema_format_enum: 'schemarb' | 'postgres' | 'prisma' | 'tbls'
      workflow_run_status: 'pending' | 'success' | 'error'
      workflow_status: 'running' | 'idle'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assistant_role_enum: ['db', 'pm', 'qa'],
      schema_format_enum: ['schemarb', 'postgres', 'prisma', 'tbls'],
      workflow_run_status: ['pending', 'success', 'error'],
      workflow_status: ['running', 'idle'],
    },
  },
} as const
