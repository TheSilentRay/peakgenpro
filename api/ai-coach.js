// api/ai-coach.js — Vercel serverless (Node.js)
// Secure proxy for Anthropic API — never exposes the key to the browser

const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido o sesión expirada' })
  }

  try {
    const { messages, athleteData } = req.body

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY no configurada en las variables de entorno de Vercel')
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message ?? `Anthropic API error ${response.status}`)
    }

    return res.status(200).json(data)

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AI Coach error:', msg)
    return res.status(400).json({ error: msg })
  }
}
