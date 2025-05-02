/**
 * Agent voice profile definitions
 * Voice settings used with OpenAI TTS API
 */
export const voiceProfiles = {
  build: { voice: 'nova' }, // Builder Jack: Bright and energetic high-pitched voice
  learn: { voice: 'fable' }, // Learn Jack: Calm and polite speaking style
  review: { voice: 'shimmer' }, // Reviewer Jack: Gentle and soft voice
}

/**
 * Agent type and voice mapping (for type safety)
 */
export type AgentVoiceType = keyof typeof voiceProfiles
