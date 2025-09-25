# OpenAI API Mock Tools Setup Guide

## Overview

Tools for fast development and debugging without waiting for slow OpenAI API responses.
You can record actual API responses and replay them at high speed.

Especially optimized for testing PM Agent's GPT-5 tool_calls streaming issues.

## Setup Steps

### 1. Install Tools

```bash
# Navigate to tools directory
cd tools

# Install dependencies
npm install
```

### 2. Recording Normal Responses

#### Terminal 1: Start Recording Proxy

```bash
# Start recording proxy
npm run record
```

You'll see messages like:
```
🎬 OpenAI Recording Proxy running on http://localhost:3457
📁 Recordings will be saved to: ./recordings
```

#### Terminal 2: Start Application

```bash
# Set environment variables (use OpenAI API via proxy)
export OPENAI_API_BASE_URL=http://localhost:3457/v1
export OPENAI_API_KEY=sk-your-actual-api-key  # Set your actual API key

# Navigate to frontend directory
cd ../frontend

# Start application including PM Agent
pnpm --filter @liam-hq/app dev:next
```

#### Browser Operation

1. Access the application
2. Actually use PM Agent features (execute processes including tool_calls)
3. Responses are automatically saved to `tools/recordings/` directory

#### Check Recordings

```bash
# Check recorded files
ls -la tools/recordings/

# Example:
# 2024-01-15T10-30-45-123Z_gpt-5_a1b2c3d4.json
```

### 3. High-Speed Playback of Recordings

#### Terminal 1: Switch to Playback Server

```bash
# Stop recording proxy (Ctrl+C)

# Start playback server
npm run playback
```

You'll see messages like:
```
🚀 OpenAI Playback Server running on http://localhost:3458
📼 Loaded 3 recordings
⚡ Playback speed: 10x
```

#### Terminal 2: Update Environment Variables

```bash
# Change to use playback server
export OPENAI_API_BASE_URL=http://localhost:3458/v1
# API key not needed (uses recorded responses)

# Restart application if needed
# Stop with Ctrl+C, then run again
pnpm --filter @liam-hq/app dev:next
```

### 4. Verify Operation

1. Perform the same operations in browser
2. Confirm responses return at **10x speed**
3. Verify PM Agent's tool_calls display works correctly

## Optional Settings

### Adjusting Playback Speed

```bash
# Playback at real-time speed (1x)
SPEED=1 npm run playback

# Playback at ultra-high speed (100x)
SPEED=100 npm run playback

# Default is 10x speed
npm run playback
```

### Checking Recorded Responses

```bash
# Get list of recordings via API
curl http://localhost:3458/_recordings | jq

# Check files directly
cat tools/recordings/*.json | jq '.request.endpoint'
```

### Simple Mock Server (No Recording Needed)

```bash
# Mock server that returns fixed responses
npm run mock

# Set environment variables
export OPENAI_API_BASE_URL=http://localhost:3456/v1
```

## Troubleshooting

### If Recordings Aren't Saved

1. Check if `tools/recordings/` directory exists
2. Verify OpenAI API key is set correctly
3. Check proxy logs for errors

### If Playback Doesn't Work

1. Check if recording files exist
2. Verify request content matches recording time
3. Check available recordings at `/_recordings` endpoint

## File Structure

```
tools/
├── package.json                  # npm scripts definition
├── README.md                     # Tool description
├── SETUP_GUIDE.md               # This file
├── openai-recorder-proxy.js     # Recording proxy
├── openai-playback-server.js    # Playback server
├── mock-openai-server.js        # Simple mock server
└── recordings/                   # Recording storage directory
    └── *.json                   # Recorded responses
```

## Important Notes

- **Security**: Recording files may contain API keys and sensitive information, don't commit to Git
- **Production Environment**: These tools are for development only. Never use in production
- **Storage**: Recording files accumulate, clean up periodically

## Benefits

1. ✅ **Fast Development**: Develop without OpenAI API delays
2. ✅ **Accurate Reproduction**: 100% accurate using actual API responses
3. ✅ **Cost Savings**: Save money by not repeating same API calls
4. ✅ **Offline Development**: Develop without internet connection
5. ✅ **Efficient Debugging**: Verify streaming behavior at 10x speed