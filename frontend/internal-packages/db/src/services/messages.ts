import type { SupabaseClient } from '@supabase/supabase-js'

export type Message = {
  id: string
  design_session_id: string
  user_id: string | null
  role: string
  content: string
  created_at: string
  updated_at: string
  organization_id: string
}

export type MessageWithUser = Message & {
  user_name: string | null
  user_email: string | null
}

export type SendMessageResponse = {
  success: boolean
  message_id?: string
  message?: string
  error?: string
}

export class MessageService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Send a message using the database function (ensures proper real-time delivery)
   */
  async sendMessage(
    designSessionId: string,
    role: string,
    content: string,
    userId?: string,
  ): Promise<SendMessageResponse> {
    const { data, error } = await this.supabase.rpc('send_message', {
      p_design_session_id: designSessionId,
      p_role: role,
      p_content: content,
      p_user_id: userId || null,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return data as SendMessageResponse
  }

  /**
   * Subscribe to PostgreSQL NOTIFY events for messages
   * This provides an additional layer of real-time notifications
   */
  // biome-ignore lint/suspicious/noExplicitAny: todo
  subscribeToMessageNotifications(callback: (payload: any) => void) {
    const channel = this.supabase.channel('message_notifications').on(
      // biome-ignore lint/suspicious/noExplicitAny: todo
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'messages',
      },
      callback,
    )

    return channel.subscribe()
  }

  /**
   * Get messages directly from the table (fallback method)
   */
  async getMessages(
    designSessionId: string,
    limit = 50,
    offset = 0,
  ): Promise<{
    data: Message[] | null
    error: string | null
  }> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('design_session_id', designSessionId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as Message[],
      error: null,
    }
  }

  /**
   * Insert a message directly (fallback method)
   */
  async insertMessage(message: {
    design_session_id: string
    user_id?: string | null
    role: string
    content: string
  }): Promise<{
    data: Message | null
    error: string | null
  }> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        ...message,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as Message,
      error: null,
    }
  }

  /**
   * Update a message
   */
  async updateMessage(
    messageId: string,
    updates: {
      content?: string
      role?: string
    },
  ): Promise<{
    data: Message | null
    error: string | null
  }> {
    const { data, error } = await this.supabase
      .from('messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as Message,
      error: null,
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{
    success: boolean
    error: string | null
  }> {
    const { error } = await this.supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

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
   * Check if a user can access messages in a design session
   */
  async canAccessMessages(designSessionId: string): Promise<{
    canAccess: boolean
    error: string | null
  }> {
    const { data, error } = await this.supabase
      .from('design_sessions')
      .select('organization_id')
      .eq('id', designSessionId)
      .single()

    if (error) {
      return {
        canAccess: false,
        error: error.message,
      }
    }

    // Check if user is member of the organization
    const { data: memberData, error: memberError } = await this.supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', data.organization_id)
      .single()

    if (memberError) {
      return {
        canAccess: false,
        error: memberError.message,
      }
    }

    return {
      canAccess: !!memberData,
      error: null,
    }
  }
}

// Factory function to create service instance
export const createMessageService = (supabase: SupabaseClient) => {
  return new MessageService(supabase)
}
