# OpenAI API Mock Tools

Tools for accelerating OpenAI API calls during development.

## 🎯 Purpose

- Develop and debug without waiting for slow OpenAI API responses
- Record and replay actual API responses
- Perfect for testing PM Agent's GPT-5 tool_calls streaming issues

## 📦 Setup

```bash
cd tools
npm install
```

## 🚀 Usage

### Step 1: Recording Normal Responses

```bash
# 1. Start recording proxy
npm run record

# 2. Set environment variables in another terminal
export OPENAI_API_BASE_URL=http://localhost:3457/v1
export OPENAI_API_KEY=sk-your-actual-key

# 3. Run application as usual
cd ../frontend
pnpm --filter @liam-hq/app dev:next

# 4. Actually use PM Agent and other features
# Responses are automatically saved to ./recordings/
```

### Step 2: Playback Recordings

```bash
# 1. Start playback server
npm run playback

# 2. Set environment variables in another terminal
export OPENAI_API_BASE_URL=http://localhost:3458/v1
# API Key not needed (uses recorded responses)

# 3. Run application
pnpm --filter @liam-hq/app dev:next

# Responses are replayed at 10x speed (default)
```

### Option: Simple Mock Server

For when you have no recordings or need simple tests:

```bash
npm run mock
export OPENAI_API_BASE_URL=http://localhost:3456/v1
```

## 🎮 Speed Adjustment

```bash
# Replay at real-time speed
SPEED=1 npm run playback

# Replay at 100x speed (ultra-fast testing)
SPEED=100 npm run playback
```

## 📁 File Structure

```
tools/
├── recordings/               # Recording files directory
│   └── *.json               # Recorded API responses
├── openai-recorder-proxy.js # Recording proxy
├── openai-playback-server.js # Playback server
└── mock-openai-server.js    # Simple mock server
```

## 🔍 Checking Recorded Content

```bash
# List recorded responses
curl http://localhost:3458/_recordings | jq
```

## 💡 Tips

1. **PM Agent Testing**: Accurately reproduces GPT-5's tool_calls streaming pattern
2. **CI/CD Integration**: Commit recording files to Git for use in CI
3. **Debugging**: Edit recording files to test edge cases

## ⚠️ Caution

- Recording files may contain API keys and sensitive information, be careful when committing to Git
- Never use in production environments