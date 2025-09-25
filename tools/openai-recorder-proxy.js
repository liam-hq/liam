#!/usr/bin/env node
/**
 * OpenAI API Recording Proxy
 * Records actual OpenAI API streaming responses for later replay
 * 
 * Usage: 
 *   1. Start proxy: node openai-recorder-proxy.js
 *   2. Set OPENAI_API_BASE_URL=http://localhost:3457/v1
 *   3. Run your application normally
 *   4. Check recordings in ./recordings/ directory
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const app = express();

// Increase payload size limit to 50MB (default is 100kb)
app.use(express.json({ limit: '50mb' }));

const PROXY_PORT = process.env.PROXY_PORT || 3457;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RECORDINGS_DIR = path.join(__dirname, 'recordings');

// Create recordings directory
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  console.log(`📁 Created recordings directory: ${RECORDINGS_DIR}`);
}

// Helper to generate recording filename
const getRecordingFilename = (endpoint, requestBody) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const model = requestBody?.model || 'unknown';
  const hash = crypto.createHash('md5')
    .update(JSON.stringify(requestBody || {}))
    .digest('hex')
    .substring(0, 8);
  return `${timestamp}_${model}_${hash}.json`;
};

// Proxy responses endpoint for GPT-5 Responses API
app.post('/v1/responses', async (req, res) => {
  console.log('\n📡 Proxying responses request (GPT-5 Responses API)');
  
  const requestBody = req.body;
  const isStreamRequest = requestBody?.stream === true;
  
  console.log('🔍 Request details:');
  console.log('  - Stream mode:', isStreamRequest);
  console.log('  - Response IDs:', requestBody?.response_ids?.length || 0);
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set!');
    return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
  }
  
  // Prepare recording object
  const recording = {
    timestamp: new Date().toISOString(),
    request: {
      method: 'POST',
      endpoint: '/v1/responses',
      body: requestBody
    },
    response: {
      chunks: [],
      data: null,
      statusCode: null
    }
  };
  
  try {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/responses',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    };
    
    if (isStreamRequest) {
      console.log('🎥 Starting streaming request (Responses API)...');
      
      // Set SSE headers for client
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      
      const openaiReq = https.request(options, (openaiRes) => {
        console.log('  - Status:', openaiRes.statusCode);
        recording.response.statusCode = openaiRes.statusCode;
        
        let buffer = '';
        let chunkCount = 0;
        
        openaiRes.on('data', (chunk) => {
          const chunkStr = chunk.toString();
          buffer += chunkStr;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line
          
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const data = line.substring(6).trim();
              
              // Record the chunk
              recording.response.chunks.push({
                timestamp: Date.now(),
                data: data
              });
              
              // Forward to client
              res.write(line + '\n\n');
              chunkCount++;
              
              if (data === '[DONE]') {
                console.log(`  ✅ Streaming complete: ${chunkCount} chunks`);
              }
            }
          }
        });
        
        openaiRes.on('end', () => {
          res.end();
          
          // Save recording
          const filename = getRecordingFilename('/v1/responses', requestBody);
          const filepath = path.join(RECORDINGS_DIR, filename);
          
          fs.writeFileSync(filepath, JSON.stringify(recording, null, 2));
          console.log(`💾 Saved recording: ${filename}`);
          console.log(`  - Total chunks: ${recording.response.chunks.length}`);
          console.log(`  - File size: ${fs.statSync(filepath).size} bytes`);
        });
        
        openaiRes.on('error', (error) => {
          console.error('❌ OpenAI response error:', error);
          res.status(500).end();
        });
      });
      
      openaiReq.on('error', (error) => {
        console.error('❌ OpenAI request error:', error);
        res.status(500).json({ error: error.message });
      });
      
      openaiReq.write(JSON.stringify(requestBody));
      openaiReq.end();
      
    } else {
      console.log('📦 Starting non-streaming request (Responses API)...');
      
      const openaiReq = https.request(options, (openaiRes) => {
        console.log('  - Status:', openaiRes.statusCode);
        recording.response.statusCode = openaiRes.statusCode;
        
        let responseData = '';
        
        openaiRes.on('data', (chunk) => {
          responseData += chunk.toString();
        });
        
        openaiRes.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            recording.response.data = jsonResponse;
            
            // Forward to client
            res.status(openaiRes.statusCode).json(jsonResponse);
            
            // Save recording
            const filename = getRecordingFilename('/v1/responses', requestBody);
            const filepath = path.join(RECORDINGS_DIR, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(recording, null, 2));
            console.log(`💾 Saved recording: ${filename}`);
            console.log(`  - File size: ${fs.statSync(filepath).size} bytes`);
            
          } catch (error) {
            console.error('❌ JSON parse error:', error);
            res.status(500).json({ error: 'Failed to parse OpenAI response' });
          }
        });
        
        openaiRes.on('error', (error) => {
          console.error('❌ OpenAI response error:', error);
          res.status(500).json({ error: error.message });
        });
      });
      
      openaiReq.on('error', (error) => {
        console.error('❌ OpenAI request error:', error);
        res.status(500).json({ error: error.message });
      });
      
      openaiReq.write(JSON.stringify(requestBody));
      openaiReq.end();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy chat/completions endpoint
app.post('/v1/chat/completions', async (req, res) => {
  console.log('\n📡 Proxying chat/completions request');
  
  const requestBody = req.body;
  const isStreamRequest = requestBody?.stream === true;
  
  console.log('🔍 Request details:');
  console.log('  - Stream mode:', isStreamRequest);
  console.log('  - Model:', requestBody?.model || 'unknown');
  console.log('  - Messages count:', requestBody?.messages?.length || 0);
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set!');
    return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
  }
  
  // Prepare recording object
  const recording = {
    timestamp: new Date().toISOString(),
    request: {
      method: 'POST',
      endpoint: '/v1/chat/completions',
      body: requestBody
    },
    response: {
      chunks: [],
      data: null,
      statusCode: null
    }
  };
  
  try {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    };
    
    if (isStreamRequest) {
      console.log('🎥 Starting streaming request...');
      
      // Set SSE headers for client
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      
      const openaiReq = https.request(options, (openaiRes) => {
        console.log('  - Status:', openaiRes.statusCode);
        recording.response.statusCode = openaiRes.statusCode;
        
        let buffer = '';
        let chunkCount = 0;
        
        openaiRes.on('data', (chunk) => {
          const chunkStr = chunk.toString();
          buffer += chunkStr;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line
          
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const data = line.substring(6).trim();
              
              // Record the chunk
              recording.response.chunks.push({
                timestamp: Date.now(),
                data: data
              });
              
              // Forward to client
              res.write(line + '\n\n');
              chunkCount++;
              
              if (data === '[DONE]') {
                console.log(`  ✅ Streaming complete: ${chunkCount} chunks`);
              }
            }
          }
        });
        
        openaiRes.on('end', () => {
          res.end();
          
          // Save recording
          const filename = getRecordingFilename('/v1/chat/completions', requestBody);
          const filepath = path.join(RECORDINGS_DIR, filename);
          
          fs.writeFileSync(filepath, JSON.stringify(recording, null, 2));
          console.log(`💾 Saved recording: ${filename}`);
          console.log(`  - Total chunks: ${recording.response.chunks.length}`);
          console.log(`  - File size: ${fs.statSync(filepath).size} bytes`);
        });
        
        openaiRes.on('error', (error) => {
          console.error('❌ OpenAI response error:', error);
          res.status(500).end();
        });
      });
      
      openaiReq.on('error', (error) => {
        console.error('❌ OpenAI request error:', error);
        res.status(500).json({ error: error.message });
      });
      
      openaiReq.write(JSON.stringify(requestBody));
      openaiReq.end();
      
    } else {
      console.log('📦 Starting non-streaming request...');
      
      const openaiReq = https.request(options, (openaiRes) => {
        console.log('  - Status:', openaiRes.statusCode);
        recording.response.statusCode = openaiRes.statusCode;
        
        let responseData = '';
        
        openaiRes.on('data', (chunk) => {
          responseData += chunk.toString();
        });
        
        openaiRes.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            recording.response.data = jsonResponse;
            
            // Forward to client
            res.status(openaiRes.statusCode).json(jsonResponse);
            
            // Save recording
            const filename = getRecordingFilename('/v1/chat/completions', requestBody);
            const filepath = path.join(RECORDINGS_DIR, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(recording, null, 2));
            console.log(`💾 Saved recording: ${filename}`);
            console.log(`  - File size: ${fs.statSync(filepath).size} bytes`);
            
          } catch (error) {
            console.error('❌ JSON parse error:', error);
            res.status(500).json({ error: 'Failed to parse OpenAI response' });
          }
        });
        
        openaiRes.on('error', (error) => {
          console.error('❌ OpenAI response error:', error);
          res.status(500).json({ error: error.message });
        });
      });
      
      openaiReq.on('error', (error) => {
        console.error('❌ OpenAI request error:', error);
        res.status(500).json({ error: error.message });
      });
      
      openaiReq.write(JSON.stringify(requestBody));
      openaiReq.end();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  const recordingCount = fs.existsSync(RECORDINGS_DIR) 
    ? fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.json')).length
    : 0;
    
  res.json({ 
    status: 'ok',
    recordings: recordingCount,
    apiKeySet: !!OPENAI_API_KEY
  });
});

// List recordings
app.get('/recordings', (req, res) => {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    return res.json([]);
  }
  
  const files = fs.readdirSync(RECORDINGS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const stats = fs.statSync(path.join(RECORDINGS_DIR, f));
      return {
        name: f,
        size: stats.size,
        modified: stats.mtime
      };
    });
    
  res.json(files);
});

app.listen(PROXY_PORT, () => {
  console.log(`\n🎬 OpenAI Recording Proxy running on http://localhost:${PROXY_PORT}`);
  console.log(`📁 Recordings directory: ${RECORDINGS_DIR}`);
  console.log(`🔑 API Key: ${OPENAI_API_KEY ? 'Set ✅' : 'Not set ❌'}`);
  
  console.log('\n📝 Usage:');
  console.log(`  export OPENAI_API_BASE_URL=http://localhost:${PROXY_PORT}/v1`);
  console.log(`  export OPENAI_API_KEY=your-actual-api-key`);
  console.log(`  pnpm --filter @liam-hq/app dev:next`);
  
  console.log('\n🔍 Endpoints:');
  console.log(`  http://localhost:${PROXY_PORT}/health     - Health check`);
  console.log(`  http://localhost:${PROXY_PORT}/recordings - List recordings`);
});