/*
 * Migration: Add 'error' role to message_role_enum
 * 
 * Purpose: Extend the message_role_enum to support error messages in chat system
 * Affected tables: messages
 * Affected enums: message_role_enum
 * 
 * This migration adds 'error' as a new value to the existing message_role_enum
 * to enable proper categorization and storage of error messages in the chat system.
 * Error messages will be displayed differently in the UI and excluded from 
 * chat history sent to AI models.
 * 
 * Backward compatibility: This is a non-breaking change. Existing code will
 * continue to work with 'user' and 'assistant' roles.
 */

begin;

-- Add 'error' value to existing message_role_enum
-- This allows messages to be categorized as errors for better UX
alter type "public"."message_role_enum" add value 'error';

-- Add index on role column for better query performance
-- This will improve filtering performance when querying messages by role
create index if not exists "idx_messages_role" on "public"."messages"("role");

commit;