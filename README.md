#  Chat with Supabase using Natural Language

Effortlessly query your **Supabase database** using **natural language** powered by **OpenAI ChatGPT**.  
This project lets you chat with your database to get table data, insights, and more — just like magic! 🪄

---

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Quasar](https://img.shields.io/badge/Quasar-1976D2?style=for-the-badge&logo=quasar&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## 📸 Demo

![Demo Screenshot](https://github.com/user-attachments/assets/ad136b33-e31b-424c-a8f8-952842f180ce)

---

## ⚙️ Prerequisites

- A **Supabase account** with some tables
- A **ChatGPT OpenAI Developer Account**
- Node.js & npm installed
- `.env` file for both `my-ai-chatbot` and `web-proxy`

---

## 🔐 Environment Variables

In your `.env` files, provide the following:

```env
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-service-role-key>
EDGE_FUNCTION_AUTH=<your-supabase-edge-function-jwt>
OPENAI_API_KEY=<your-openai-api-key>
```

# 🔧 Supabase Setup
1. 🧱 Create the Edge Function

Go to Supabase → Edge Functions → Create new → Paste the code below:

```
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(supabaseUrl, supabaseKey);

  try {
    const { sql } = await req.json();
    if (!sql || typeof sql !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid SQL string" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const { data, error } = await client.rpc("execute_raw_sql", { sql_text: sql });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
```
2. 🛠️ Create the SQL Function

Go to SQL Editor in Supabase and run:
```
create or replace function execute_raw_sql(sql_text text)
returns json
language plpgsql
as $$
declare
  result json;
begin
  execute format('SELECT json_agg(t) FROM (%s) t', sql_text)
  into result;
  return result;
exception
  when others then
    raise exception 'Error executing SQL: %', sqlerrm;
end;
$$;
```

# Running the Project

Make sure you've updated both .env files.
1️⃣ Start the Web Proxy

```
cd websocket-proxy
node server.js
```

2️⃣ Start the Chatbot App

```
cd my-ai-chatbot
npx quasar dev
```
