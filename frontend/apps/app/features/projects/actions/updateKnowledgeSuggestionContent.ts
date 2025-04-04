'use server'

import { createClient } from '@/libs/db/server'
import * as v from 'valibot'

const formDataSchema = v.object({
  suggestionId: v.pipe(
    v.string(),
    v.transform((value) => Number(value)),
  ),
  content: v.string(),
})

export const updateKnowledgeSuggestionContent = async (formData: FormData) => {
  const formDataObject = {
    suggestionId: formData.get('suggestionId'),
    content: formData.get('content'),
  }

  const parsedData = v.safeParse(formDataSchema, formDataObject)

  if (!parsedData.success) {
    throw new Error(`Invalid form data: ${JSON.stringify(parsedData.issues)}`)
  }

  const { suggestionId, content } = parsedData.output

  try {
    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('KnowledgeSuggestion')
      .update({ content, updatedAt: new Date().toISOString() })
      .eq('id', suggestionId)

    if (updateError) {
      throw new Error('Failed to update knowledge suggestion content')
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating knowledge suggestion content:', error)
    throw error
  }
}
