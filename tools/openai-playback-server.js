#!/usr/bin/env node
/**
 * OpenAI Playback Server
 * Replays recorded OpenAI API responses with accurate timing
 * 
 * Usage:
 *   1. Record responses using openai-recorder-proxy.js
 *   2. Start playback: node openai-playback-server.js [recording-file]
 *   3. Set OPENAI_API_BASE_URL=http://localhost:3458/v1
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Increase payload size limit to 50MB (default is 100kb)
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3458;
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
const SPEED_MULTIPLIER = process.env.SPEED || 10; // 10x faster by default

// Load all recordings
const recordings = new Map();

// Load recordings from directory
function loadRecordings() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    console.log('⚠️  No recordings directory found. Run the recorder proxy first.');
    return;
  }

  const files = fs.readdirSync(RECORDINGS_DIR);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filepath = path.join(RECORDINGS_DIR, file);
      const recording = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      // Create key from request signature
      const key = `${recording.request.method}:${recording.request.endpoint}:${JSON.stringify(recording.request.body)}`;
      recordings.set(key, recording);
      console.log(`📼 Loaded recording: ${file}`);
    }
  });
}

// Match request to recording
function findRecording(method, endpoint, body) {
  const key = `${method}:${endpoint}:${JSON.stringify(body)}`;
  
  // Exact match
  if (recordings.has(key)) {
    return recordings.get(key);
  }

  // Find similar recording (same endpoint and model)
  for (const [k, recording] of recordings) {
    if (recording.request.endpoint === endpoint && 
        recording.request.method === method &&
        recording.request.body?.model === body?.model) {
      console.log('🔄 Using similar recording (different prompt)');
      return recording;
    }
  }

  return null;
}

// Playback streaming response
async function playbackStreaming(res, chunks) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  if (!chunks || chunks.length === 0) {
    res.end();
    return;
  }

  // Calculate delays between chunks
  let lastTimestamp = chunks[0].timestamp;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const delay = i === 0 ? 0 : (chunk.timestamp - lastTimestamp) / SPEED_MULTIPLIER;
    lastTimestamp = chunk.timestamp;

    // Wait before sending chunk
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 100)));
    }

    // Send chunk
    res.write(`data: ${chunk.data}\n\n`);
  }

  res.end();
  console.log(`✅ Replayed ${chunks.length} chunks at ${SPEED_MULTIPLIER}x speed`);
}

// Handle responses API
app.post('/v1/responses', async (req, res) => {
  const endpoint = '/v1/responses';
  console.log(`🎯 ${req.method} ${endpoint} (GPT-5 Responses API)`);

  const recording = findRecording(req.method, endpoint, req.body);
  
  if (!recording) {
    console.log('❌ No recording found for responses request');
    
    // Return a fallback response for Responses API
    if (req.body?.stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      });
      
      // Simulate GPT-5 Responses API pattern
      const mockChunks = [
        { role: 'assistant', content: '', tool_calls: [{ id: 'call_mock', type: 'function', function: { name: 'mock_tool', arguments: '' } }] },
        { tool_calls: [{ index: 0, function: { arguments: '{"data":"mock response from responses API"}' } }] },
        { finish_reason: 'tool_calls' }
      ];

      for (const chunk of mockChunks) {
        res.write(`data: ${JSON.stringify({
          id: 'resp-mock',
          choices: [{ delta: chunk, index: 0 }]
        })}\n\n`);
        await new Promise(r => setTimeout(r, 10));
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(404).json({ error: 'No recording found for responses endpoint' });
    }
    return;
  }

  console.log(`🎬 Playing back recording from ${recording.timestamp}`);

  // Playback the recorded response
  if (req.body?.stream && recording.response.chunks) {
    await playbackStreaming(res, recording.response.chunks);
  } else if (recording.response.data) {
    res.status(recording.response.statusCode || 200).json(recording.response.data);
  } else {
    res.status(500).json({ error: 'Invalid recording format' });
  }
});

// Handle chat/completions API
app.post('/v1/chat/completions', async (req, res) => {
  const endpoint = '/v1/chat/completions';
  console.log(`🎯 ${req.method} ${endpoint}`);

  const recording = findRecording(req.method, endpoint, req.body);
  
  if (!recording) {
    console.log('❌ No recording found for chat/completions request');
    
    // Return a fallback response
    if (req.body?.stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      });
      
      // Standard chat completion mock
      const mockChunks = [
        { role: 'assistant', content: 'Mock response from playback server' }
      ];

      for (const chunk of mockChunks) {
        res.write(`data: ${JSON.stringify({
          id: 'chatcmpl-mock',
          choices: [{ delta: chunk, index: 0 }]
        })}\n\n`);
        await new Promise(r => setTimeout(r, 10));
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(404).json({ error: 'No recording found for chat/completions' });
    }
    return;
  }

  console.log(`🎬 Playing back recording from ${recording.timestamp}`);

  // Playback the recorded response
  if (req.body?.stream && recording.response.chunks) {
    await playbackStreaming(res, recording.response.chunks);
  } else if (recording.response.data) {
    res.status(recording.response.statusCode || 200).json(recording.response.data);
  } else {
    res.status(500).json({ error: 'Invalid recording format' });
  }
});

// Handle all other API requests (fallback)
app.all('*', async (req, res) => {
  const endpoint = req.path;
  console.log(`🎯 ${req.method} ${endpoint}`);

  const recording = findRecording(req.method, endpoint, req.body);
  
  if (!recording) {
    console.log('❌ No recording found for this request');
    
    // Return a fallback response
    if (req.body?.stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      });
      
      // Simulate GPT-5 tool calling pattern
      const mockChunks = [
        { role: 'assistant', content: '', tool_calls: [{ id: 'call_mock', type: 'function', function: { name: 'mock_tool', arguments: '' } }] },
        { tool_calls: [{ index: 0, function: { arguments: '{"data":' } }] },
        { tool_calls: [{ index: 0, function: { arguments: '"mock response"}' } }] },
        { finish_reason: 'tool_calls' }
      ];

      for (const chunk of mockChunks) {
        res.write(`data: ${JSON.stringify({
          id: 'chatcmpl-mock',
          choices: [{ delta: chunk, index: 0 }]
        })}\n\n`);
        await new Promise(r => setTimeout(r, 10));
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(404).json({ error: 'No recording found', request: { method: req.method, endpoint, body: req.body } });
    }
    return;
  }

  console.log(`🎬 Playing back recording from ${recording.timestamp}`);

  // Playback the recorded response
  if (req.body?.stream && recording.response.chunks) {
    await playbackStreaming(res, recording.response.chunks);
  } else if (recording.response.data) {
    res.status(recording.response.statusCode || 200).json(recording.response.data);
  } else {
    res.status(500).json({ error: 'Invalid recording format' });
  }
});

// List available recordings
app.get('/_recordings', (req, res) => {
  const list = [];
  for (const [key, recording] of recordings) {
    list.push({
      key,
      timestamp: recording.timestamp,
      endpoint: recording.request.endpoint,
      model: recording.request.body?.model,
      streaming: !!recording.response.chunks
    });
  }
  res.json(list);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    recordings: recordings.size,
    speed: `${SPEED_MULTIPLIER}x`
  });
});

// Load recordings and start server
loadRecordings();

app.listen(PORT, () => {
  console.log(`🚀 OpenAI Playback Server running on http://localhost:${PORT}`);
  console.log(`📼 Loaded ${recordings.size} recordings`);
  console.log(`⚡ Playback speed: ${SPEED_MULTIPLIER}x`);
  console.log('\n📝 Configure your app:');
  console.log(`  export OPENAI_API_BASE_URL=http://localhost:${PORT}/v1`);
  console.log(`  export SPEED=1  # For real-time playback`);
  console.log('\n📊 View recordings: http://localhost:${PORT}/_recordings');
});