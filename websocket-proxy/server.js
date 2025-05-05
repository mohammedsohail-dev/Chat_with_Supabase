import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;


const supabase = createClient(supabaseUrl, supabaseKey);



const { data } = await supabase.functions.invoke('sql_query', {
  headers: {
    Authorization:
    `Bearer ${process.env.EDGE_FUNCTION_AUTH}`,
  },
  body: { 
    sql: 'SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = \'public\' ORDER BY table_name, ordinal_position'
  },
});

const schemaData = data.data;

console.log(schemaData);

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (clientSocket) => {
  console.log('Client connected.');
  
  const openaiSocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", {
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  // System prompt for consistent AI behavior
  const systemMessage = {
    type: "conversation.item.create",
    item: {
      role: "system",
      type: "message",
      content: [
        {
          type: "input_text",
          text: `You are an intelligent SQL assistant. When a user asks a question, reply with just the query with the back ticks and sql mentioned before the rawcode but no semicolon like this: \\n \\\`\\\`\\\`sql {rawcode}\\\`\\\`\\\` . The schema to the table is as follows:\\n\\n${JSON.stringify(schemaData, null, 2)}`
        },
      ],
    },
  };

  openaiSocket.on('open', () => {
    console.log('Connected to OpenAI WebSocket.');
    // Send initial system message to set the behavior
    openaiSocket.send(JSON.stringify(systemMessage));
  });

  clientSocket.on('message', (message) => {
    if (openaiSocket.readyState !== WebSocket.OPEN) return;

    try {
      const clientData = JSON.parse(message.toString());
      console.log("Received message from client:", clientData);

      const openaiFormattedMessage = {
        type: "conversation.item.create",
        item: {
          role: "user",
          type: "message",
          content: [
            {
              type: "input_text",
              text: clientData.message,
            },
          ],
        },
      };

      console.log("Sending message to OpenAI:", openaiFormattedMessage);
      openaiSocket.send(JSON.stringify(openaiFormattedMessage));

      const responseRequest = {
        type: "response.create",
        response: {
          modalities: ["text"],
        },
      };

      console.log("Requesting response from OpenAI");
      openaiSocket.send(JSON.stringify(responseRequest));
    } catch (err) {
      console.error("Failed to parse client message as JSON", err);
    }
  });

  // Forward OpenAI → Client
  openaiSocket.on('message', (data) => {
    const messageString = data.toString('utf8');
    console.log("Received message from OpenAI:", messageString);
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(messageString);
    }
  });

  openaiSocket.on('close', () => {
    console.log('OpenAI WebSocket closed.');
    clientSocket.close();
  });

  openaiSocket.on('error', (err) => {
    console.error('OpenAI WebSocket error:', err);
    clientSocket.close();
  });

  clientSocket.on('close', () => {
    console.log('Client disconnected.');
    openaiSocket.close();
  });

  clientSocket.on('error', (err) => {
    console.error('Client WebSocket error:', err);
    openaiSocket.close();
  });
});

console.log('Proxy WebSocket server running on ws://localhost:8080');
