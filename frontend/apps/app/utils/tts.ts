'use client'

import { type AgentVoiceType, voiceProfiles } from './voiceProfiles'

// For managing audio playback state
let currentAudio: HTMLAudioElement | null = null

/**
 * Interface for audio playback control
 */
export interface AudioControl {
  stop: () => void
  onEnd?: () => void
}

/**
 * Read agent's message aloud with voice
 * @param agentType Agent type (build, learn, review)
 * @param text Text to be read aloud
 * @returns Control object for managing audio playback
 */
export const speakAgentMessage = async (
  agentType: AgentVoiceType,
  text: string,
): Promise<AudioControl> => {
  // Stop any existing audio playback
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  // Get the voice corresponding to the agent type
  const voice = voiceProfiles[agentType].voice

  try {
    // Get audio data via API
    const response = await fetch('/api/openai-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    })

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`)
    }

    // Get audio data as Blob
    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    // Create and play Audio element
    const audio = new Audio(audioUrl)
    currentAudio = audio

    // Control object
    const control: AudioControl = {
      stop: () => {
        if (audio) {
          audio.pause()
          URL.revokeObjectURL(audioUrl)
          currentAudio = null
        }
      },
    }

    // Process when playback ends
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl) // Prevent memory leak
      currentAudio = null
      if (control.onEnd) {
        control.onEnd()
      }
    }

    await audio.play()

    // Return control for managing audio playback
    return control
  } catch (error) {
    console.error('Failed to play TTS audio:', error)
    throw error
  }
}
