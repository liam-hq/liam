# OpenAI TTS (Text-to-Speech) Feature

This document explains the agent voice reading feature using the OpenAI TTS API.

## Overview

We have implemented a feature that uses the OpenAI TTS (Text-to-Speech) API to read aloud the responses from agents (Builder Jack, Learn Jack, Reviewer Jack) appearing in the chat. Each agent is assigned a different voice, expressing their character through audio as well.

## Voice Profiles

The following voices are assigned to each agent:

| Agent         | Personality | Assigned Voice | Notes                                   |
| ------------- | ----------- | -------------- | --------------------------------------- |
| Builder Jack  | Energetic   | `nova`         | Bright and energetic high-pitched voice |
| Learn Jack    | Serious     | `fable`        | Calm and polite speaking style          |
| Reviewer Jack | Cute girl   | `shimmer`      | Gentle and soft, sister-like character  |

## Implementation Mechanism

1. **Voice Profile Definition**: Define voices corresponding to each agent type in `utils/voiceProfiles.ts`
2. **TTS Utility**: Implement functions for voice generation and playback in `utils/tts.ts`
3. **API Endpoint**: Handle communication with OpenAI API in `app/api/openai-tts/route.ts`
4. **UI Component**: Add voice playback button to `ChatMessage.tsx`

## Usage

When an agent's message is displayed, click the voice button (speaker icon) in the message to read that message aloud. Click the same button during playback to stop the voice playback.

## Environment Setup

To use this feature, you need to set the OpenAI API key in the `.env.local` file:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Technical Details

### API Specification

The OpenAI TTS API accepts the following parameters:

- `model`: The model to use (`tts-1` or high-quality version `tts-1-hd`)
- `voice`: The voice to use (`nova`, `fable`, `shimmer`, etc.)
- `input`: The text to read aloud

### Voice Caching

The current implementation does not cache voices, but in the future, we could add a feature to cache and reuse voices for the same text, reducing API calls and improving performance.

### Future Extensions

1. **Settings Panel**: Toggle for voice playback ON/OFF and volume adjustment
2. **Voice Customization**: Feature allowing users to select voices for each agent
3. **Voice Marks**: Implementation of lip-sync animation if OpenAI adds a `speech marks` feature

## Notes

- OpenAI's TTS is available for commercial use (check terms of service)
- Free tier available (voice generation cost is approximately $0.015 per 1000 characters)
- As of 2024, "childlike voices" are only at a "somewhat similar" level
