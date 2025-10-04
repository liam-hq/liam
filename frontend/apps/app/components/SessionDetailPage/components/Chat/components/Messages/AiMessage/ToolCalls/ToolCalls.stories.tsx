import type { ToolCalls as ToolCallsType } from '@liam-hq/agent/client'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { ToolCalls } from './ToolCalls'

const meta: Meta<typeof ToolCalls> = {
  component: ToolCalls,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    isStreaming: {
      control: 'boolean',
      description: 'Whether the tool is currently executing',
    },
  },
}

export default meta
type Story = StoryObj<typeof ToolCalls>

// Note: We use undefined for toolMessage to test default message handling in ToolCallCard
// This avoids type assertion issues while still properly testing the UI

const schemaDesignCall: ToolCallsType[number] = {
  id: 'call_1',
  name: 'schemaDesignTool',
  type: 'tool_call',
  args: {
    operations: [
      // Users table
      { op: 'add', path: '/tables/users', value: { name: 'users' } },
      {
        op: 'add',
        path: '/tables/users/columns/id',
        value: { name: 'id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/users/columns/email',
        value: {
          name: 'email',
          type: 'varchar(255)',
          notNull: true,
          unique: true,
        },
      },
      {
        op: 'add',
        path: '/tables/users/columns/username',
        value: {
          name: 'username',
          type: 'varchar(100)',
          notNull: true,
          unique: true,
        },
      },
      {
        op: 'add',
        path: '/tables/users/columns/password_hash',
        value: { name: 'password_hash', type: 'varchar(255)', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/users/columns/first_name',
        value: { name: 'first_name', type: 'varchar(100)' },
      },
      {
        op: 'add',
        path: '/tables/users/columns/last_name',
        value: { name: 'last_name', type: 'varchar(100)' },
      },
      {
        op: 'add',
        path: '/tables/users/columns/avatar_url',
        value: { name: 'avatar_url', type: 'text' },
      },
      {
        op: 'add',
        path: '/tables/users/columns/is_active',
        value: { name: 'is_active', type: 'boolean', default: true },
      },
      {
        op: 'add',
        path: '/tables/users/columns/email_verified_at',
        value: { name: 'email_verified_at', type: 'timestamp' },
      },
      {
        op: 'add',
        path: '/tables/users/columns/created_at',
        value: { name: 'created_at', type: 'timestamp', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/users/columns/updated_at',
        value: { name: 'updated_at', type: 'timestamp', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/users/constraints/pk_users',
        value: { type: 'primary_key', columns: ['id'] },
      },
      {
        op: 'add',
        path: '/tables/users/indexes/idx_email',
        value: { columns: ['email'] },
      },
      {
        op: 'add',
        path: '/tables/users/indexes/idx_username',
        value: { columns: ['username'] },
      },

      // Organizations table
      {
        op: 'add',
        path: '/tables/organizations',
        value: { name: 'organizations' },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/id',
        value: { name: 'id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/name',
        value: { name: 'name', type: 'varchar(255)', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/slug',
        value: {
          name: 'slug',
          type: 'varchar(100)',
          notNull: true,
          unique: true,
        },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/description',
        value: { name: 'description', type: 'text' },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/logo_url',
        value: { name: 'logo_url', type: 'text' },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/owner_id',
        value: { name: 'owner_id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/created_at',
        value: { name: 'created_at', type: 'timestamp', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organizations/columns/updated_at',
        value: { name: 'updated_at', type: 'timestamp', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organizations/constraints/pk_organizations',
        value: { type: 'primary_key', columns: ['id'] },
      },
      {
        op: 'add',
        path: '/tables/organizations/constraints/fk_owner',
        value: {
          type: 'foreign_key',
          columns: ['owner_id'],
          references: { table: 'users', columns: ['id'] },
        },
      },

      // Organization members junction table
      {
        op: 'add',
        path: '/tables/organization_members',
        value: { name: 'organization_members' },
      },
      {
        op: 'add',
        path: '/tables/organization_members/columns/id',
        value: { name: 'id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organization_members/columns/organization_id',
        value: { name: 'organization_id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organization_members/columns/user_id',
        value: { name: 'user_id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organization_members/columns/role',
        value: {
          name: 'role',
          type: 'varchar(50)',
          notNull: true,
          default: 'member',
        },
      },
      {
        op: 'add',
        path: '/tables/organization_members/columns/invited_by',
        value: { name: 'invited_by', type: 'uuid' },
      },
      {
        op: 'add',
        path: '/tables/organization_members/columns/joined_at',
        value: { name: 'joined_at', type: 'timestamp', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/organization_members/constraints/pk_org_members',
        value: { type: 'primary_key', columns: ['id'] },
      },
      {
        op: 'add',
        path: '/tables/organization_members/constraints/fk_organization',
        value: {
          type: 'foreign_key',
          columns: ['organization_id'],
          references: { table: 'organizations', columns: ['id'] },
        },
      },
      {
        op: 'add',
        path: '/tables/organization_members/constraints/fk_user',
        value: {
          type: 'foreign_key',
          columns: ['user_id'],
          references: { table: 'users', columns: ['id'] },
        },
      },
      {
        op: 'add',
        path: '/tables/organization_members/constraints/uq_org_user',
        value: { type: 'unique', columns: ['organization_id', 'user_id'] },
      },

      // Projects table
      { op: 'add', path: '/tables/projects', value: { name: 'projects' } },
      {
        op: 'add',
        path: '/tables/projects/columns/id',
        value: { name: 'id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/organization_id',
        value: { name: 'organization_id', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/name',
        value: { name: 'name', type: 'varchar(255)', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/description',
        value: { name: 'description', type: 'text' },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/status',
        value: {
          name: 'status',
          type: 'varchar(50)',
          notNull: true,
          default: 'active',
        },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/visibility',
        value: {
          name: 'visibility',
          type: 'varchar(20)',
          notNull: true,
          default: 'private',
        },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/created_by',
        value: { name: 'created_by', type: 'uuid', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/created_at',
        value: { name: 'created_at', type: 'timestamp', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/projects/columns/updated_at',
        value: { name: 'updated_at', type: 'timestamp', notNull: true },
      },
      {
        op: 'add',
        path: '/tables/projects/constraints/pk_projects',
        value: { type: 'primary_key', columns: ['id'] },
      },
      {
        op: 'add',
        path: '/tables/projects/constraints/fk_project_org',
        value: {
          type: 'foreign_key',
          columns: ['organization_id'],
          references: { table: 'organizations', columns: ['id'] },
        },
      },
      {
        op: 'add',
        path: '/tables/projects/constraints/fk_created_by',
        value: {
          type: 'foreign_key',
          columns: ['created_by'],
          references: { table: 'users', columns: ['id'] },
        },
      },
      {
        op: 'add',
        path: '/tables/projects/indexes/idx_org_projects',
        value: { columns: ['organization_id'] },
      },
      {
        op: 'add',
        path: '/tables/projects/indexes/idx_status',
        value: { columns: ['status'] },
      },
    ],
  },
}

const saveRequirementsCall: ToolCallsType[number] = {
  id: 'call_2',
  name: 'saveRequirementsToArtifactTool',
  type: 'tool_call',
  args: {
    goal: 'Build a comprehensive user management system with authentication, authorization, profile management, and administrative features',
    testcases: {
      'User Registration': [
        { title: 'New registration with email and password', type: 'INSERT' },
        { title: 'Email verification with token expiration', type: 'UPDATE' },
        { title: 'Encrypted password storage using bcrypt', type: 'INSERT' },
        { title: 'Profile completion wizard', type: 'UPDATE' },
        { title: 'Social media authentication (OAuth 2.0)', type: 'INSERT' },
        { title: 'Two-factor authentication setup', type: 'INSERT' },
        { title: 'Terms of service acceptance tracking', type: 'INSERT' },
        { title: 'GDPR compliance for data collection', type: 'INSERT' },
      ],
      'Login Function': [
        { title: 'Login with email and password', type: 'SELECT' },
        { title: 'Session management with JWT tokens', type: 'INSERT' },
        { title: 'Remember Me feature with secure cookies', type: 'UPDATE' },
        { title: 'Login history tracking', type: 'INSERT' },
        { title: 'Failed login attempt monitoring', type: 'INSERT' },
        { title: 'Account lockout after multiple failures', type: 'UPDATE' },
        { title: 'Password reset via email', type: 'UPDATE' },
        { title: 'Magic link authentication option', type: 'INSERT' },
      ],
      'User Profile': [
        { title: 'View and edit personal information', type: 'SELECT' },
        { title: 'Avatar upload with image processing', type: 'UPDATE' },
        { title: 'Privacy settings management', type: 'UPDATE' },
        { title: 'Notification preferences', type: 'UPDATE' },
        { title: 'Connected devices management', type: 'SELECT' },
        { title: 'Activity log viewing', type: 'SELECT' },
        { title: 'Data export functionality', type: 'SELECT' },
        { title: 'Account deletion with grace period', type: 'DELETE' },
      ],
      Authorization: [
        { title: 'Role-based access control (RBAC)', type: 'SELECT' },
        { title: 'Permission management system', type: 'UPDATE' },
        { title: 'Resource-level permissions', type: 'SELECT' },
        { title: 'API key generation and management', type: 'INSERT' },
        { title: 'OAuth scope management', type: 'UPDATE' },
        { title: 'Delegation capabilities', type: 'INSERT' },
      ],
      'Admin Panel': [
        { title: 'User list with advanced filtering', type: 'SELECT' },
        { title: 'User detail view and editing', type: 'UPDATE' },
        { title: 'Bulk user operations', type: 'UPDATE' },
        { title: 'Role and permission assignment', type: 'UPDATE' },
        { title: 'System audit logs', type: 'SELECT' },
        { title: 'Analytics dashboard', type: 'SELECT' },
        { title: 'User impersonation for support', type: 'UPDATE' },
      ],
    },
  },
}

const saveTestcaseCall: ToolCallsType[number] = {
  id: 'call_3',
  name: 'saveTestcase',
  type: 'tool_call',
  args: {
    name: 'User Profile Update Test',
    description: 'Verify that users can update their profile information',
    dmlOperation: {
      sql: "UPDATE users SET first_name = 'John', last_name = 'Doe' WHERE id = '123'",
      type: 'update',
    },
  },
}

const runTestCall: ToolCallsType[number] = {
  id: 'call_4',
  name: 'runTestTool',
  type: 'tool_call',
  args: {
    testIds: ['test_1', 'test_2', 'test_3'],
  },
}

// Individual tool stories
export const SchemaDesign: Story = {
  name: 'Schema Design Tool',
  args: {
    toolCallsWithMessages: [
      {
        toolCall: schemaDesignCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
    ],
    isStreaming: true,
  },
}

export const SaveRequirements: Story = {
  name: 'Save Requirements Tool',
  args: {
    toolCallsWithMessages: [
      {
        toolCall: saveRequirementsCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
    ],
    isStreaming: true,
  },
}

export const SaveTestcase: Story = {
  name: 'Save Testcase Tool',
  args: {
    toolCallsWithMessages: [
      {
        toolCall: saveTestcaseCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
    ],
    isStreaming: true,
  },
}

export const RunTest: Story = {
  name: 'Run Test Tool',
  args: {
    toolCallsWithMessages: [
      {
        toolCall: runTestCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
    ],
    isStreaming: true,
  },
}

// Static/Completed versions for reload behavior testing
export const LoadedSession: Story = {
  args: {
    toolCallsWithMessages: [
      {
        toolCall: schemaDesignCall,
        toolMessage: undefined,
      },
      {
        toolCall: saveRequirementsCall,
        toolMessage: undefined,
      },
    ],
    isStreaming: false, // This simulates loading an existing session
  },
}

export const AllToolsCompleted: Story = {
  name: 'All Tools (Completed - Reload Behavior)',
  args: {
    toolCallsWithMessages: [
      {
        toolCall: schemaDesignCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
      {
        toolCall: saveRequirementsCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
      {
        toolCall: saveTestcaseCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
      {
        toolCall: runTestCall,
        toolMessage: undefined, // Use default message: "Tool execution completed."
      },
    ],
    isStreaming: false,
  },
}
