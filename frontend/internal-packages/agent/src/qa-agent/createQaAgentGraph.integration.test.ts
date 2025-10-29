import { HumanMessage } from '@langchain/core/messages'
import { END } from '@langchain/langgraph'
import { aColumn, aSchema, aTable, aUniqueConstraint } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../test-utils/workflowTestHelpers'
import { createQaAgentGraph } from './createQaAgentGraph'
import type { QaAgentState } from './shared/qaAgentAnnotation'

describe('createQaAgentGraph Integration', () => {
  it('should execute complete QA agent workflow with real APIs', async () => {
    // Arrange
    const graph = createQaAgentGraph()
    const { config, context } = await getTestConfig()

    const userInput =
      'Generate comprehensive test cases for user authentication and role-based access control'

    // Sample schema data for testing - comprehensive auth and RBAC schema
    const schemaData = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
            }),
            password_hash: aColumn({
              name: 'password_hash',
              type: 'varchar(255)',
              notNull: true,
            }),
            role_id: aColumn({ name: 'role_id', type: 'uuid', notNull: true }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
            updated_at: aColumn({
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
            is_active: aColumn({
              name: 'is_active',
              type: 'boolean',
              default: true,
            }),
            last_login_at: aColumn({
              name: 'last_login_at',
              type: 'timestamp',
            }),
            reset_token: aColumn({
              name: 'reset_token',
              type: 'varchar(255)',
            }),
            reset_token_expires_at: aColumn({
              name: 'reset_token_expires_at',
              type: 'timestamp',
            }),
          },
          constraints: {
            users_email_unique: aUniqueConstraint({
              name: 'users_email_unique',
              columnNames: ['email'],
            }),
          },
        }),
        roles: aTable({
          name: 'roles',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            name: aColumn({
              name: 'name',
              type: 'varchar(100)',
              notNull: true,
            }),
            description: aColumn({ name: 'description', type: 'text' }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
          },
        }),
        permissions: aTable({
          name: 'permissions',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            name: aColumn({
              name: 'name',
              type: 'varchar(100)',
              notNull: true,
            }),
            resource: aColumn({
              name: 'resource',
              type: 'varchar(100)',
              notNull: true,
            }),
            action: aColumn({
              name: 'action',
              type: 'varchar(50)',
              notNull: true,
            }),
            description: aColumn({ name: 'description', type: 'text' }),
          },
        }),
        role_permissions: aTable({
          name: 'role_permissions',
          columns: {
            role_id: aColumn({ name: 'role_id', type: 'uuid', notNull: true }),
            permission_id: aColumn({
              name: 'permission_id',
              type: 'uuid',
              notNull: true,
            }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
          },
        }),
        sessions: aTable({
          name: 'sessions',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            user_id: aColumn({ name: 'user_id', type: 'uuid', notNull: true }),
            token: aColumn({
              name: 'token',
              type: 'varchar(255)',
              notNull: true,
            }),
            ip_address: aColumn({ name: 'ip_address', type: 'varchar(45)' }),
            user_agent: aColumn({ name: 'user_agent', type: 'text' }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
            expires_at: aColumn({
              name: 'expires_at',
              type: 'timestamp',
              notNull: true,
            }),
            is_valid: aColumn({
              name: 'is_valid',
              type: 'boolean',
              default: true,
            }),
          },
        }),
        audit_logs: aTable({
          name: 'audit_logs',
          columns: {
            id: aColumn({ name: 'id', type: 'uuid', notNull: true }),
            user_id: aColumn({ name: 'user_id', type: 'uuid', notNull: true }),
            action: aColumn({
              name: 'action',
              type: 'varchar(100)',
              notNull: true,
            }),
            resource: aColumn({
              name: 'resource',
              type: 'varchar(100)',
              notNull: true,
            }),
            resource_id: aColumn({ name: 'resource_id', type: 'uuid' }),
            status: aColumn({
              name: 'status',
              type: 'varchar(20)',
              notNull: true,
            }),
            metadata: aColumn({ name: 'metadata', type: 'jsonb' }),
            created_at: aColumn({
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            }),
          },
        }),
      },
      extensions: { 'uuid-ossp': { name: 'uuid-ossp' } },
    })

    const state: QaAgentState = {
      messages: [new HumanMessage(userInput)],
      schemaData,
      analyzedRequirements: {
        goal: 'Implement secure user authentication and role-based access control system with comprehensive permission management and audit logging',
        testcases: {
          Authentication: [
            {
              id: 'auth-1',
              title:
                'Users can register with email, password, and be assigned a role',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'auth-2',
              title: 'Users can change their password',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'auth-3',
              title: 'System validates user login credentials',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'auth-4',
              title: 'System prevents duplicate email registration',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'auth-5',
              title: 'Inactive users cannot login to the system',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'auth-6',
              title: 'Users can request password reset',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'auth-7',
              title: 'Users can be deactivated to prevent future logins',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'auth-8',
              title: 'System can retrieve all active users',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
          ],
          Authorization: [
            {
              id: 'authz-1',
              title: 'Admin users can create new roles and assign permissions',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-2',
              title:
                'System verifies users have required permissions for actions',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-3',
              title: 'Admins can change user roles to modify their permissions',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-4',
              title: 'Multiple permissions can be assigned to a single role',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-5',
              title: 'System can list all permissions for a specific resource',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-6',
              title: 'Admins can remove permissions from a role',
              type: 'DELETE',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-7',
              title: 'Admins can create new permissions for resources',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-8',
              title: 'Admins can delete roles from the system',
              type: 'DELETE',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-9',
              title: 'Admins can update permission definitions',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'authz-10',
              title: 'Admins can delete unused permissions',
              type: 'DELETE',
              sql: '',
              testResults: [],
            },
          ],
          SessionManagement: [
            {
              id: 'session-1',
              title: 'Users can login and create a new session',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'session-2',
              title: 'Users are automatically logged out after session expires',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'session-3',
              title: 'Users can log out from their account',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'session-4',
              title:
                'Users can maintain multiple active sessions on different devices',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'session-5',
              title: 'Users can log out from all devices at once',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'session-6',
              title: 'System prevents access with expired or invalid sessions',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
          ],
          UserManagement: [
            {
              id: 'user-1',
              title: 'Admins can view all registered users with their roles',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'user-2',
              title: 'System can search users by email address',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'user-3',
              title: 'Admins can update user information',
              type: 'UPDATE',
              sql: '',
              testResults: [],
            },
            {
              id: 'user-4',
              title: 'System tracks when user information was last updated',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'user-5',
              title: 'Users can be permanently deleted from the system',
              type: 'DELETE',
              sql: '',
              testResults: [],
            },
            {
              id: 'user-6',
              title: 'System can retrieve user count grouped by role',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'user-7',
              title: 'Admins can view user login history',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
          ],
          AuditTrail: [
            {
              id: 'audit-1',
              title: 'System logs all user actions for security tracking',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'audit-2',
              title:
                'Failed login attempts are recorded for security monitoring',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'audit-3',
              title: 'System can record additional context for each action',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
            {
              id: 'audit-4',
              title: 'Admins can view complete action history for a user',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'audit-5',
              title: 'Admins can filter audit logs by resource type',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
            {
              id: 'audit-6',
              title: 'Admins can filter audit logs by time period',
              type: 'SELECT',
              sql: '',
              testResults: [],
            },
          ],
        },
      },
      designSessionId: context.designSessionId,
      schemaIssues: [],
      generatedSqls: [],
      next: END,
    }

    // Act
    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })

    // Assert (Output)
    await outputStreamEvents(streamEvents)
  })
})
