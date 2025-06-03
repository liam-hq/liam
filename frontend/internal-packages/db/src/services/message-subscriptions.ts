import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DesignSessionSubscriber,
  MessageSubscription,
  MessageSubscriptionFilters,
  MessageSubscriptionInsert,
  MessageSubscriptionUpdate,
  SubscriptionResponse,
} from '../types/message-subscriptions'

export class MessageSubscriptionService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Subscribe a user to a design session for message notifications
   */
  async subscribeToDesignSession(
    designSessionId: string,
  ): Promise<SubscriptionResponse> {
    const { data, error } = await this.supabase.rpc(
      'subscribe_to_design_session',
      {
        p_design_session_id: designSessionId,
      },
    )

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return data as SubscriptionResponse
  }

  /**
   * Unsubscribe a user from a design session
   */
  async unsubscribeFromDesignSession(
    designSessionId: string,
  ): Promise<SubscriptionResponse> {
    const { data, error } = await this.supabase.rpc(
      'unsubscribe_from_design_session',
      {
        p_design_session_id: designSessionId,
      },
    )

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return data as SubscriptionResponse
  }

  /**
   * Get all subscribers for a design session
   */
  async getDesignSessionSubscribers(designSessionId: string): Promise<{
    data: DesignSessionSubscriber[] | null
    error: string | null
  }> {
    const { data, error } = await this.supabase.rpc(
      'get_design_session_subscribers',
      {
        p_design_session_id: designSessionId,
      },
    )

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as DesignSessionSubscriber[],
      error: null,
    }
  }

  /**
   * Get message subscriptions with optional filters
   */
  async getMessageSubscriptions(filters?: MessageSubscriptionFilters): Promise<{
    data: MessageSubscription[] | null
    error: string | null
  }> {
    let query = this.supabase.from('message_subscriptions').select('*')

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.design_session_id) {
      query = query.eq('design_session_id', filters.design_session_id)
    }
    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as MessageSubscription[],
      error: null,
    }
  }

  /**
   * Get a specific message subscription by ID
   */
  async getMessageSubscription(id: string): Promise<{
    data: MessageSubscription | null
    error: string | null
  }> {
    const { data, error } = await this.supabase
      .from('message_subscriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as MessageSubscription,
      error: null,
    }
  }

  /**
   * Check if a user is subscribed to a design session
   */
  async isUserSubscribed(
    designSessionId: string,
    userId?: string,
  ): Promise<{
    isSubscribed: boolean
    error: string | null
  }> {
    let query = this.supabase
      .from('message_subscriptions')
      .select('id')
      .eq('design_session_id', designSessionId)
      .eq('is_active', true)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.single()

    if (error) {
      // If no subscription found, that's not an error - just means not subscribed
      if (error.code === 'PGRST116') {
        return {
          isSubscribed: false,
          error: null,
        }
      }
      return {
        isSubscribed: false,
        error: error.message,
      }
    }

    return {
      isSubscribed: !!data,
      error: null,
    }
  }

  /**
   * Create a message subscription directly (alternative to using the RPC function)
   */
  async createMessageSubscription(
    subscription: MessageSubscriptionInsert,
  ): Promise<{
    data: MessageSubscription | null
    error: string | null
  }> {
    const { data, error } = await this.supabase
      .from('message_subscriptions')
      .insert(subscription)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as MessageSubscription,
      error: null,
    }
  }

  /**
   * Update a message subscription
   */
  async updateMessageSubscription(
    id: string,
    updates: MessageSubscriptionUpdate,
  ): Promise<{
    data: MessageSubscription | null
    error: string | null
  }> {
    const { data, error } = await this.supabase
      .from('message_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as MessageSubscription,
      error: null,
    }
  }

  /**
   * Delete a message subscription
   */
  async deleteMessageSubscription(id: string): Promise<{
    success: boolean
    error: string | null
  }> {
    const { error } = await this.supabase
      .from('message_subscriptions')
      .delete()
      .eq('id', id)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      error: null,
    }
  }

  /**
   * Get user's active subscriptions
   */
  async getUserActiveSubscriptions(userId?: string): Promise<{
    data: MessageSubscription[] | null
    error: string | null
  }> {
    let query = this.supabase
      .from('message_subscriptions')
      .select(`
        *,
        design_session:design_sessions(
          id,
          name,
          project_id,
          projects(
            id,
            name
          )
        )
      `)
      .eq('is_active', true)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.order('subscribed_at', {
      ascending: false,
    })

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as MessageSubscription[],
      error: null,
    }
  }

  /**
   * Subscribe to real-time changes for message subscriptions
   */
  subscribeToChanges(
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      new?: MessageSubscription
      old?: MessageSubscription
      errors?: string[]
    }) => void,
    filters?: { design_session_id?: string; user_id?: string },
  ) {
    const channelName = `message_subscriptions_${Date.now()}`
    const channel = this.supabase.channel(channelName)

    // Subscribe to postgres changes
    const config: {
      event: '*'
      schema: 'public'
      table: 'message_subscriptions'
      filter?: string
    } = {
      event: '*',
      schema: 'public',
      table: 'message_subscriptions',
    }

    if (filters?.design_session_id) {
      config.filter = `design_session_id=eq.${filters.design_session_id}`
    } else if (filters?.user_id) {
      config.filter = `user_id=eq.${filters.user_id}`
    }

    channel.on(
      'postgres_changes' as const,
      config,
      callback as (payload: unknown) => void,
    )

    return channel.subscribe()
  }
}

// Factory function to create service instance
export const createMessageSubscriptionService = (supabase: SupabaseClient) => {
  return new MessageSubscriptionService(supabase)
}
