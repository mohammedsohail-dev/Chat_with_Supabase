#Chat with Supabase database directly to fetch tables and get insights using Natural Language:
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Quasar](https://img.shields.io/badge/Quasar-1976D2?style=for-the-badge&logo=quasar&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)


![image](https://github.com/user-attachments/assets/ad136b33-e31b-424c-a8f8-952842f180ce)


For this first have an Supabase account with tables running

Now Gather all of the following Tokens Required:

```
SUPABASE_URL
SUPABASE_KEY
```

and paste them in .env of the my-ai-chatbot and web-proxy

Now 
Create an Edge Function in Supabase and paste this code

```
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};
serve(async (req)=>{
  // ✅ Handle OPTIONS method (preflight request)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(supabaseUrl, supabaseKey);
  try {
    const { sql } = await req.json();
    if (!sql || typeof sql !== "string") {
      return new Response(JSON.stringify({
        error: "Missing or invalid SQL string"
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const { data, error } = await client.rpc("execute_raw_sql", {
      sql_text: sql
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify({
      data
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

```

After paste and running this Edge function run this Query in SQL console from Supabase 
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


Once you create an Edge Function get the Authentication Token and Paste in .env as 
```
EDGE_FUNCTION_AUTH
```

Finally create an OPEN AI DEV Account and get the OPEN_AI API key and update .env as the project uses CHATGPT WEB SOCKETS TO WORK
```
OPENAI_API_KEY
```


now run the web-proxy by running
```
node server.js
```

and the ChatBot by running
```
npx quasar dev
```
