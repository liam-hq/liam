import type { Meta, StoryObj } from '@storybook/nextjs'
import { Artifact } from './Artifact'

const meta = {
  component: Artifact,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a', // Approximate dark background color
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          height: '100vh',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Artifact>

export default meta
type Story = StoryObj<typeof meta>

const sampleMarkdown = `# Requirements Document

This document outlines system requirements and their associated data manipulation language (DML) operations.

---

## 📋 Business Requirements

The system should provide a comprehensive user management platform that allows administrators to manage user accounts, roles, and permissions efficiently while maintaining security and audit trails.

## 🔧 Functional Requirements

### 1. User Management

The system must provide functionality to create, read, update, and delete user accounts with appropriate role-based access control.

**Test Cases:**

#### 1. Create New User

Administrators should be able to create new user accounts with basic information and assign initial roles.

**Related DML Operations:**

\`\`\`sql
INSERT INTO users (username, email, created_at)
VALUES ('john_doe', 'john@example.com', NOW());
\`\`\`

#### 2. Update User Information

Users should be able to update their profile information including email, password, and display name.

\`\`\`sql
UPDATE users 
SET email = 'newemail@example.com', 
    updated_at = NOW()
WHERE user_id = 123;
\`\`\`

### 2. Role Management

The system must support flexible role creation and assignment with granular permissions.

**Test Cases:**

#### 1. Assign Role to User

Administrators can assign one or more roles to users based on their responsibilities.

\`\`\`sql
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (123, 456, NOW());
\`\`\`

## 📊 Non-Functional Requirements

### 1. Performance

The system should handle up to 10,000 concurrent users with response times under 200ms for standard operations.

### 2. Security

All user data must be encrypted at rest and in transit, with multi-factor authentication available for sensitive operations.

### 3. Scalability

The architecture should support horizontal scaling to accommodate growing user base without significant refactoring.
`

export const Default: Story = {
  name: 'Default',
  args: {
    doc: sampleMarkdown,
  },
}

export const WithLongSQLQueries: Story = {
  name: 'With Long SQL Queries',
  args: {
    doc: `# SQL Query Overflow Test

## Long Single-Line Query

\`\`\`sql
SELECT users.id, users.username, users.email, users.first_name, users.last_name, users.phone_number, users.date_of_birth, users.registration_date, users.last_login_date, users.account_status, users.email_verified, users.phone_verified, users.two_factor_enabled, users.preferred_language, users.timezone, users.notification_preferences, profiles.bio, profiles.avatar_url, profiles.cover_photo_url, profiles.website_url, profiles.location, profiles.occupation FROM users LEFT JOIN profiles ON users.id = profiles.user_id WHERE users.account_status = 'active' AND users.email_verified = true ORDER BY users.registration_date DESC LIMIT 100;
\`\`\`

## Complex Table Creation

\`\`\`sql
CREATE TABLE comprehensive_user_activity_tracking_table (
    activity_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    activity_type ENUM('page_view', 'button_click', 'form_submission', 'api_call', 'file_download', 'file_upload', 'search_query', 'video_play', 'video_pause', 'video_complete'),
    activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_url VARCHAR(2048),
    referrer_url VARCHAR(2048),
    user_agent_string VARCHAR(500),
    ip_address_anonymized VARCHAR(45),
    geographic_country VARCHAR(100),
    geographic_region VARCHAR(100),
    geographic_city VARCHAR(100),
    device_type ENUM('desktop', 'tablet', 'mobile', 'smart_tv', 'game_console', 'wearable', 'other'),
    operating_system VARCHAR(50),
    browser_name VARCHAR(50),
    browser_version VARCHAR(20),
    screen_resolution VARCHAR(20),
    viewport_dimensions VARCHAR(20),
    connection_type VARCHAR(20),
    estimated_bandwidth_mbps DECIMAL(10, 2),
    interaction_element_id VARCHAR(255),
    interaction_element_class VARCHAR(500),
    interaction_element_text TEXT,
    custom_event_properties JSON,
    experiment_variant_assignments JSON,
    feature_flags_active JSON,
    error_messages TEXT,
    performance_metrics JSON,
    CONSTRAINT fk_user_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_activity_user_timestamp (user_id, activity_timestamp),
    INDEX idx_user_activity_session (session_id),
    INDEX idx_user_activity_type_timestamp (activity_type, activity_timestamp),
    INDEX idx_user_activity_timestamp (activity_timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
\`\`\`

## Regular Text

This is regular markdown text that should wrap normally without horizontal scrolling. Even if this paragraph becomes very long with many words, it should wrap to the next line rather than causing horizontal overflow.

## Normal Query

\`\`\`sql
SELECT * FROM users WHERE active = true;
\`\`\`
`,
  },
}
