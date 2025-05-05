<template>
  <q-page class="flex flex-center border q-pa-xl q-gutter-xl">
    <q-card class="chat-box column q-pa-xl">
      <q-card-section class="text-h3">Natural Language to SQL</q-card-section>

      <q-card-section class="chat-container column gutter-md bg-blue-1">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="[msg.sender === 'bot' ? 'chatbot' : 'user', 'full-width', 'q-pa-sm', 'flex']"
        >
          <div class="bg-white q-pa-md chat-bubble shadow-1">
            {{ msg.text }}
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-card-section bordered class="input-box q-gutter-sm row items-center">
          <q-input
            v-model="inputValue"
            label="Enter text"
            class="full-width"
            @keyup.enter="sendMessage"
          >
            <template #append>
              <q-btn icon="send" @click="sendMessage" />
            </template>
          </q-input>
        </q-card-section>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-xl" flat bordered>
      <q-card-section class="text-h6">Dynamic Data Table</q-card-section>

      <q-card-section>
        <q-table
          :rows="jsonTableData"
          :columns="jsonTableColumns"
          row-key="id"
          flat
          dense
          bordered
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
let socket: WebSocket;
const inputValue = ref('');
const messages = ref<{ sender: 'user' | 'bot'; text: string }[]>([]);
import { supabase } from '../boot/supabaseClient';
const jsonTableData = ref<[]>([]);
const jsonTableColumns = ref<
  {
    name: string;
    label: string;
    field: string;
    align: 'left' | 'right' | 'center';
    sortable: boolean;
  }[]
>([]);

onMounted(() => {
  socket = new WebSocket('ws://localhost:8080');
  socket.addEventListener('open', () => {
    console.log('AI is Connected');
  });

  socket.addEventListener('message', (event) => {
    void handleSocketMessage(event);
  });

  async function handleSocketMessage(event: MessageEvent) {
    const rawData = JSON.parse(event.data);

    if (rawData.type === 'response.done') {
      const text = rawData.response.output[0].content[0].text;
      const sql_match = text.match(/```sql\s+([\s\S]*?)```/i);
      messages.value.push({ sender: 'bot', text });

      // OPTIONAL: If the AI gives a SQL query in the response, send it

      const extractedSQL = sql_match ? sql_match[1].trim() : null;

      if (extractedSQL) {
        console.log(extractedSQL);
        const { data, error } = await supabase.functions.invoke('sql_query', {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_EDGE_FUNCTION_AUTH}`,
          },
          body: { sql: extractedSQL },
        });

        console.log(data);

        if (error) {
          console.error('Edge Function Error:', error);
          return;
        }

        console.log(data.data);

        if (data.data) {
          jsonTableData.value = data.data;

          if (data.data.length > 0) {
            jsonTableColumns.value = Object.keys(data.data[0]).map((key) => ({
              name: key,
              label: key,
              field: key,
              align: 'left' as const,
              sortable: true,
            }));
          }
        }
      }
    }
  }

  socket.addEventListener('close', () => {
    console.log('WebSocket closed');
  });

  socket.addEventListener('error', (error) => {
    console.error('🚨 WebSocket error:', error);
  });
});

function sendMessage() {
  const message = inputValue.value.trim();
  if (!message) return;
  messages.value.push({ sender: 'user', text: message });
  socket.send(JSON.stringify({ message }));

  inputValue.value = '';
}
</script>

<style scoped>
.chat-box {
  min-width: 500px;
  max-width: 500px;
}

.chat-container {
  overflow-y: auto;
  max-height: 400px;
  min-height: 400px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: flex-start; /* or center if you want them centered */
}

/* Sender alignment */
.chatbot {
  justify-content: flex-start;
  height: auto;
}

.user {
  justify-content: flex-end;
  height: auto;
}

/* Bubbles */
.chat-bubble {
  border-radius: 16px;
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.4;
  background-color: #ffffff;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.05);
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 75%;
  width: fit-content;
}
</style>
