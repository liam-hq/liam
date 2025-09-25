#!/usr/bin/env node
/**
 * OpenAI Streaming API Mock Server
 * Usage: node mock-openai-server.js
 * 
 * GPT-5 with tool_calls streaming behavior simulation
 */

const express = require('express');
const app = express();
// Increase payload size limit to 50MB (default is 100kb)
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3456;

// Mock streaming response for chat completions
app.post('/v1/chat/completions', (req, res) => {
  const { stream = false, messages, tools } = req.body;
  
  if (!stream) {
    // Non-streaming response
    res.json({
      id: 'chatcmpl-' + Date.now(),
      choices: [{
        message: {
          role: 'assistant',
          content: 'Mock response: ' + messages[messages.length - 1].content
        },
        finish_reason: 'stop',
        index: 0
      }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
    });
    return;
  }

  // SSE streaming response
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendChunk = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const streamId = 'chatcmpl-' + Date.now();
  let delay = 5; // Super fast responses (5ms between chunks)

  // Simulate GPT-5 tool calling pattern
  if (tools && tools.length > 0) {
    // Phase 1: Empty tool_calls chunks (GPT-5 behavior)
    setTimeout(() => {
      sendChunk({
        id: streamId,
        choices: [{
          delta: {
            role: 'assistant',
            content: '',
            tool_calls: [{
              index: 0,
              id: 'call_' + Date.now(),
              type: 'function',
              function: { name: tools[0].function.name, arguments: '' }
            }]
          },
          index: 0
        }]
      });
    }, delay);

    // Phase 2: Arguments come in separate chunks
    setTimeout(() => {
      sendChunk({
        id: streamId,
        choices: [{
          delta: {
            tool_calls: [{
              index: 0,
              function: { arguments: '{"query":' }
            }]
          },
          index: 0
        }]
      });
    }, delay * 2);

    setTimeout(() => {
      sendChunk({
        id: streamId,
        choices: [{
          delta: {
            tool_calls: [{
              index: 0,
              function: { arguments: '"test data"}' }
            }]
          },
          index: 0
        }]
      });
    }, delay * 3);

    // Phase 3: Finish
    setTimeout(() => {
      sendChunk({
        id: streamId,
        choices: [{
          delta: {},
          finish_reason: 'tool_calls',
          index: 0
        }]
      });
      res.write('data: [DONE]\n\n');
      res.end();
    }, delay * 4);

  } else {
    // Regular text streaming
    const words = ['This', 'is', 'a', 'mock', 'response', 'from', 'the', 'server.'];
    
    words.forEach((word, index) => {
      setTimeout(() => {
        sendChunk({
          id: streamId,
          choices: [{
            delta: { content: (index > 0 ? ' ' : '') + word },
            index: 0
          }]
        });
        
        if (index === words.length - 1) {
          setTimeout(() => {
            sendChunk({
              id: streamId,
              choices: [{
                delta: {},
                finish_reason: 'stop',
                index: 0
              }]
            });
            res.write('data: [DONE]\n\n');
            res.end();
          }, delay);
        }
      }, delay * (index + 1));
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock OpenAI server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock OpenAI server running on http://localhost:${PORT}`);
  console.log(`📝 Set your OpenAI base URL to: http://localhost:${PORT}/v1`);
  console.log('\nExample usage:');
  console.log(`  export OPENAI_API_BASE_URL=http://localhost:${PORT}/v1`);
  console.log('  # or in your code:');
  console.log(`  new ChatOpenAI({ configuration: { basePath: "http://localhost:${PORT}/v1" } })`);
});