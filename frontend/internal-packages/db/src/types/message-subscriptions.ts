// Base types for message subscriptions
export type MessageSubscription = {
  id: string
  user_id: string
  design_session_id: string
  organization_id: string
  is_active: boolean
  subscribed_at: string
  unsubscribed_at: string | null
  created_at: string
  updated_at: string
}

export type MessageSubscriptionInsert = {
  id?: string
  user_id: string
  design_session_id: string
  organization_id?: string // Auto-set by trigger
  is_active?: boolean
  subscribed_at?: string
  unsubscribed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type MessageSubscriptionUpdate = {
  id?: string
  user_id?: string
  design_session_id?: string
  organization_id?: string
  is_active?: boolean
  subscribed_at?: string
  unsubscribed_at?: string | null
  created_at?: string
  updated_at?: string
}

// Extended types for API responses
export type MessageSubscriptionWithUser = MessageSubscription & {
  user: {
    id: string
    name: string
    email: string
  }
}

export type MessageSubscriptionWithDesignSession = MessageSubscription & {
  design_session: {
    id: string
    name: string
    project_id: string
  }
}

// Function response types
export type SubscriptionResponse = {
  success: boolean
  subscription_id?: string
  message?: string
  error?: string
}

export type DesignSessionSubscriber = {
  user_id: string
  user_name: string
  user_email: string
  subscribed_at: string
}

// Subscription status constants
export const SubscriptionStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export type SubscriptionStatusType =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

// Helper type for subscription filters
export type MessageSubscriptionFilters = {
  user_id?: string
  design_session_id?: string
  organization_id?: string
  is_active?: boolean
}
