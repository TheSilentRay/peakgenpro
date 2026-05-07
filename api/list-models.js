// api/list-models.js — temporary debug endpoint
// Visit /api/list-models to see which Gemini models your API key can access
// DELETE this file after you've confirmed the working model name

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const key = process.env.GEMINI_API_KEY
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not set' })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  )
  const data = await response.json()

  // Return just the model names and supported methods for readability
  const models = (data.models || []).map(m => ({
    name: m.name,
    displayName: m.displayName,
    supportedMethods: m.supportedGenerationMethods,
  }))

  return res.status(200).json({ total: models.length, models })
}
