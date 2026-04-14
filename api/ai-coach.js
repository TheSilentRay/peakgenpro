// api/ai-coach.js — Vercel serverless (Node.js)
// Secure proxy for Google Gemini API — never exposes the key to the browser

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

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY no configurada en las variables de entorno de Vercel')
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

    // Convert messages from Anthropic format {role, content} to Gemini format {role, parts}
    // Gemini uses 'model' instead of 'assistant'
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      const errMsg = data.error?.message ?? `Gemini API error ${response.status}`
      throw new Error(errMsg)
    }

    // Normalize to a simple { text } response the frontend can read
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No se pudo obtener respuesta.'
    return res.status(200).json({ text })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AI Coach error:', msg)
    return res.status(400).json({ error: msg })
  }
}
