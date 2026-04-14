// api/sync-garmin.js  — Vercel serverless (Node.js)
// Replaces the Supabase Edge Function to avoid Deno/npm incompatibility

const { createClient } = require('@supabase/supabase-js')
const { GarminConnect } = require('garmin-connect')

// Increase Vercel function timeout (Pro plan: up to 300s; Hobby: 10-15s)
// If you hit timeout on Hobby, upgrade to Pro or reduce DAYS_TO_SYNC below.
module.exports.config = { maxDuration: 60 }

const DAYS_TO_SYNC = 30

const safeCall = async (fn) => {
  try { return await fn() } catch { return null }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'No autorizado' })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'Token inválido o sesión expirada' })
  }

  const userId = user.id

  try {
    // Create sync log
    const { data: syncLog } = await supabase
      .from('sync_logs')
      .insert({ user_id: userId, sync_type: 'incremental', status: 'running' })
      .select('id')
      .single()
    const syncLogId = syncLog?.id ?? null

    // Get Garmin credentials
    const { data: creds, error: credsError } = await supabase
      .from('garmin_credentials')
      .select('garmin_username, garmin_password_encrypted')
      .eq('user_id', userId)
      .single()

    if (credsError || !creds) {
      throw new Error('No se encontraron credenciales de Garmin. Por favor reconecta tu cuenta.')
    }

    const username = creds.garmin_username
    const password = Buffer.from(creds.garmin_password_encrypted, 'base64').toString('utf-8')

    // Authenticate with Garmin Connect
    const gc = new GarminConnect({ username, password })
    try {
      await gc.login(username, password)
    } catch (loginErr) {
      const msg = loginErr instanceof Error ? loginErr.message : String(loginErr)
      if (/mfa|2fa|verification|multi.factor|two.factor/i.test(msg)) {
        throw new Error(
          'Tu cuenta Garmin tiene autenticación de dos factores activada. ' +
          'Desactívala temporalmente en connect.garmin.com > Configuración de cuenta.'
        )
      }
      throw new Error(`Error de autenticación con Garmin Connect: ${msg}. Verifica usuario y contraseña.`)
    }

    let sessionsSynced = 0
    let metricsSynced = 0
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (DAYS_TO_SYNC - 1))

    // ── 1. Activities ────────────────────────────────────────────────
    const activities = await safeCall(() => gc.getActivities(0, 30)) ?? []
    for (const activity of activities) {
      const saved = await safeCall(() =>
        supabase.from('training_sessions').upsert({
          user_id: userId,
          garmin_activity_id: Number(activity.activityId),
          activity_type: activity.activityType?.typeKey ?? activity.activityType?.typeId ?? 'unknown',
          start_time: activity.startTimeLocal ?? activity.startTimeGMT,
          duration_min: activity.duration ? Math.round(activity.duration / 60) : null,
          distance_km: activity.distance ? parseFloat((activity.distance / 1000).toFixed(2)) : null,
          avg_hr: activity.averageHR ?? null,
          max_hr: activity.maxHR ?? null,
          calories: activity.calories ?? null,
          tss: activity.trainingStressScore ?? null,
          avg_speed_kmh: activity.averageSpeed ? parseFloat((activity.averageSpeed * 3.6).toFixed(2)) : null,
          avg_power_watts: activity.avgPower ?? null,
          elevation_gain_m: activity.elevationGain ?? null,
          vo2max_estimate: activity.vO2MaxValue ?? null,
          raw_data: activity,
        }, { onConflict: 'garmin_activity_id' })
      )
      if (saved !== null) sessionsSynced++
    }

    // ── 2. Body Battery ──────────────────────────────────────────────
    const bodyBatteryByDate = {}
    // garmin-connect expects a date-range array: [startDate, endDate]
    const bbData = await safeCall(() => gc.getBodyBattery([startDate, today]))
    if (Array.isArray(bbData)) {
      for (const entry of bbData) {
        const ts = entry.startTimestampLocal ?? entry.startTimestampGMT
        if (ts) {
          const d = new Date(ts).toISOString().split('T')[0]
          const val = entry.charged ?? entry.value ?? 0
          bodyBatteryByDate[d] = Math.max(bodyBatteryByDate[d] ?? 0, val)
        }
      }
    }

    // ── 3. Daily Metrics ─────────────────────────────────────────────
    const gcAny = gc
    for (let i = DAYS_TO_SYNC - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      let sleepHours = null, sleepScore = null, sleepDeepHours = null
      let sleepRemHours = null, sleepLightHours = null, sleepAwakeHours = null
      let hrvMs = null, restingHr = null, stressScore = null
      let steps = null, caloriesActive = null, caloriesTotal = null
      const rawData = {}

      // Sleep
      const sleepData = await safeCall(() => gc.getSleepData(date))
      const dto = sleepData?.dailySleepDTO
      if (dto) {
        sleepHours = dto.sleepTimeSeconds ? parseFloat((dto.sleepTimeSeconds / 3600).toFixed(2)) : null
        sleepScore = dto.sleepScores?.overall?.value ?? dto.sleepScore ?? null
        sleepDeepHours = dto.deepSleepSeconds ? parseFloat((dto.deepSleepSeconds / 3600).toFixed(2)) : null
        sleepRemHours = dto.remSleepSeconds ? parseFloat((dto.remSleepSeconds / 3600).toFixed(2)) : null
        sleepLightHours = dto.lightSleepSeconds ? parseFloat((dto.lightSleepSeconds / 3600).toFixed(2)) : null
        sleepAwakeHours = dto.awakeSleepSeconds ? parseFloat((dto.awakeSleepSeconds / 3600).toFixed(2)) : null
        rawData.sleep = sleepData
      }

      // Daily summary — try each method in order until one succeeds
      let summary = await safeCall(() => gcAny.getDailySummary?.(date))
      if (!summary) summary = await safeCall(() => gcAny.getUserSummary?.(date))
      if (!summary) summary = await safeCall(() => gcAny.getDailyHealthStats?.(date))
      if (summary) {
        steps = summary.totalSteps ?? null
        caloriesActive = summary.activeKilocalories ?? null
        caloriesTotal = summary.totalKilocalories ?? null
        stressScore = summary.avgStressLevel ?? null
        restingHr = summary.restingHeartRate ?? null
        rawData.summary = summary
      }

      // Resting HR fallback
      if (!restingHr) {
        const hrData = await safeCall(() => gc.getHeartRate(date))
        restingHr = hrData?.restingHeartRate ?? null
        if (hrData) rawData.heartRate = hrData
      }

      // HRV
      let hrvData = await safeCall(() => gcAny.getHrv?.(date))
      if (!hrvData) hrvData = await safeCall(() => gcAny.getHRV?.(date))
      if (hrvData?.hrvSummary) {
        hrvMs = hrvData.hrvSummary.lastNight ?? hrvData.hrvSummary.weeklyAvg ?? null
        rawData.hrv = hrvData
      }

      // Composite readiness score
      let readinessScore = null
      let weightedSum = 0, totalWeight = 0
      if (sleepScore !== null) { weightedSum += sleepScore * 0.35; totalWeight += 0.35 }
      if (hrvMs !== null) { weightedSum += Math.min(100, (hrvMs / 80) * 100) * 0.30; totalWeight += 0.30 }
      if (bodyBatteryByDate[dateStr] !== undefined) { weightedSum += bodyBatteryByDate[dateStr] * 0.20; totalWeight += 0.20 }
      if (stressScore !== null) { weightedSum += (100 - stressScore) * 0.15; totalWeight += 0.15 }
      if (totalWeight >= 0.35) readinessScore = Math.round(weightedSum / totalWeight)

      const { error: dbError } = await supabase.from('daily_metrics').upsert({
        user_id: userId,
        date: dateStr,
        hrv_ms: hrvMs,
        resting_hr: restingHr,
        sleep_hours: sleepHours,
        sleep_score: sleepScore,
        sleep_deep_hours: sleepDeepHours,
        sleep_rem_hours: sleepRemHours,
        sleep_light_hours: sleepLightHours,
        sleep_awake_hours: sleepAwakeHours,
        readiness_score: readinessScore,
        body_battery: bodyBatteryByDate[dateStr] ?? null,
        stress_score: stressScore,
        steps,
        calories_active: caloriesActive,
        calories_total: caloriesTotal,
        raw_data: rawData,
      }, { onConflict: 'user_id,date' })

      if (!dbError) metricsSynced++
    }

    // Update credentials status
    await supabase
      .from('garmin_credentials')
      .update({ last_sync_at: new Date().toISOString(), sync_status: 'success' })
      .eq('user_id', userId)

    if (syncLogId) {
      await supabase.from('sync_logs').update({
        status: 'success',
        sessions_synced: sessionsSynced,
        metrics_synced: metricsSynced,
        completed_at: new Date().toISOString(),
      }).eq('id', syncLogId)
    }

    return res.status(200).json({ success: true, sessions_synced: sessionsSynced, metrics_synced: metricsSynced })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Garmin sync failed:', msg)

    await supabase.from('garmin_credentials')
      .update({ sync_status: 'error' })
      .eq('user_id', userId)
      .catch(() => {})

    return res.status(400).json({ success: false, error: msg })
  }
}
