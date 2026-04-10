// supabase/functions/ai-coach/index.ts
// Deploy: supabase functions deploy ai-coach

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // Validate JWT
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  const userSupabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  try {
    const { messages, athleteData } = await req.json()

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY no configurada en Supabase secrets")
    }

    const systemPrompt = `Eres un coach deportivo de élite con expertise en fisiología del rendimiento, periodización y recuperación. Tienes acceso a los datos reales del atleta desde su dispositivo Garmin.

PERFIL DEL ATLETA:
${JSON.stringify(athleteData, null, 2)}

INSTRUCCIONES:
- Responde siempre en español
- Sé directo, específico y basado en datos
- Cita métricas concretas del atleta en tus respuestas
- Usa unidades correctas (ms para HRV, bpm para FC, km para distancia)
- Mantén un tono profesional pero accesible
- Si no tienes datos suficientes, indícalo claramente
- Respuestas concisas (3-5 párrafos máximo)
- Nunca des consejos médicos, solo de rendimiento deportivo`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message ?? `Anthropic API error ${response.status}`)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("AI Coach error:", msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
