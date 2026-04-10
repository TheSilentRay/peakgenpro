// supabase/functions/sync-garmin/index.ts
// Deploy: supabase functions deploy sync-garmin

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GarminConnect } from "npm:garmin-connect"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const safeCall = async <T>(fn: () => Promise<T>): Promise<T | null> => {
  try { return await fn() } catch { return null }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // Validate JWT from Supabase client (auto-sent by supabase.functions.invoke)
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  // Verify the token and get the user
  const userSupabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user: authUser } } = await userSupabase.auth.getUser()
  if (!authUser) {
    return new Response(JSON.stringify({ success: false, error: "Token inválido" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  const userId = authUser.id
  let syncLogId: string | null = null

  try {
    // Create sync log entry
    const { data: syncLog } = await supabase
      .from("sync_logs")
      .insert({ user_id: userId, sync_type: "incremental", status: "running" })
      .select("id")
      .single()
    syncLogId = syncLog?.id ?? null

    // Get stored Garmin credentials
    const { data: creds, error: credsError } = await supabase
      .from("garmin_credentials")
      .select("garmin_username, garmin_password_encrypted")
      .eq("user_id", userId)
      .single()

    if (credsError || !creds) {
      throw new Error("No se encontraron credenciales de Garmin. Por favor reconecta tu cuenta.")
    }

    const username = creds.garmin_username
    const password = atob(creds.garmin_password_encrypted)

    // Initialize and authenticate with Garmin Connect
    const gc = new GarminConnect({ username, password })

    try {
      await gc.login(username, password)
    } catch (loginErr: unknown) {
      const msg = loginErr instanceof Error ? loginErr.message : String(loginErr)
      if (/mfa|2fa|verification|multi.factor|two.factor/i.test(msg)) {
        throw new Error(
          "Tu cuenta Garmin tiene autenticación de dos factores activada. " +
          "Desactívala temporalmente en connect.garmin.com > Configuración de cuenta para poder sincronizar."
        )
      }
      throw new Error(
        `Error de autenticación con Garmin Connect: ${msg}. ` +
        "Verifica que tu usuario y contraseña sean correctos."
      )
    }

    let sessionsSynced = 0
    let metricsSynced = 0
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 29)

    // ============================================================
    // 1. SYNC ACTIVITIES — last 30 activities (single API call)
    // ============================================================
    const activities = await safeCall(() => gc.getActivities(0, 30))
    await delay(200)

    for (const activity of activities ?? []) {
      const saved = await safeCall(() =>
        supabase.from("training_sessions").upsert({
          user_id: userId,
          garmin_activity_id: Number(activity.activityId),
          activity_type: activity.activityType?.typeKey ?? activity.activityType?.typeId ?? "unknown",
          start_time: activity.startTimeLocal ?? activity.startTimeGMT,
          duration_min: activity.duration ? Math.round(activity.duration / 60) : null,
          distance_km: activity.distance ? parseFloat((activity.distance / 1000).toFixed(2)) : null,
          avg_hr: activity.averageHR ?? null,
          max_hr: activity.maxHR ?? null,
          calories: activity.calories ?? null,
          tss: activity.trainingStressScore ?? null,
          avg_speed_kmh: activity.averageSpeed
            ? parseFloat((activity.averageSpeed * 3.6).toFixed(2))
            : null,
          avg_power_watts: activity.avgPower ?? null,
          elevation_gain_m: activity.elevationGain ?? null,
          vo2max_estimate: activity.vO2MaxValue ?? null,
          raw_data: activity,
        }, { onConflict: "garmin_activity_id" })
      )
      if (saved !== null) sessionsSynced++
    }

    // ============================================================
    // 2. BODY BATTERY — full range, single API call
    // ============================================================
    const bodyBatteryByDate: Record<string, number> = {}
    const bbData = await safeCall(() => (gc as any).getBodyBattery([startDate, today]))
    await delay(200)

    if (Array.isArray(bbData)) {
      for (const entry of bbData) {
        const ts = entry.startTimestampLocal ?? entry.startTimestampGMT
        if (ts) {
          const d = new Date(ts).toISOString().split("T")[0]
          const val = entry.charged ?? entry.value ?? 0
          bodyBatteryByDate[d] = Math.max(bodyBatteryByDate[d] ?? 0, val)
        }
      }
    }

    // ============================================================
    // 3. DAILY METRICS — 30 days, ~3 API calls per day
    // ============================================================
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      let sleepHours: number | null = null
      let sleepScore: number | null = null
      let sleepDeepHours: number | null = null
      let sleepRemHours: number | null = null
      let sleepLightHours: number | null = null
      let sleepAwakeHours: number | null = null
      let hrvMs: number | null = null
      let restingHr: number | null = null
      let stressScore: number | null = null
      let steps: number | null = null
      let caloriesActive: number | null = null
      let caloriesTotal: number | null = null
      const rawData: Record<string, unknown> = {}

      // --- Sleep ---
      const sleepData = await safeCall(() => gc.getSleepData(date))
      await delay(120)
      const dto = sleepData?.dailySleepDTO
      if (dto) {
        sleepHours = dto.sleepTimeSeconds
          ? parseFloat((dto.sleepTimeSeconds / 3600).toFixed(2))
          : null
        sleepScore = dto.sleepScores?.overall?.value ?? dto.sleepScore ?? null
        sleepDeepHours = dto.deepSleepSeconds
          ? parseFloat((dto.deepSleepSeconds / 3600).toFixed(2))
          : null
        sleepRemHours = dto.remSleepSeconds
          ? parseFloat((dto.remSleepSeconds / 3600).toFixed(2))
          : null
        sleepLightHours = dto.lightSleepSeconds
          ? parseFloat((dto.lightSleepSeconds / 3600).toFixed(2))
          : null
        sleepAwakeHours = dto.awakeSleepSeconds
          ? parseFloat((dto.awakeSleepSeconds / 3600).toFixed(2))
          : null
        rawData.sleep = sleepData
      }

      // --- Daily summary (steps, calories, stress, resting HR) ---
      // Try multiple method names across garmin-connect versions
      const gcAny = gc as any
      const summary =
        await safeCall(() => gcAny.getDailyHealthStats?.(date)) ??
        await safeCall(() => gcAny.getUserSummary?.(date)) ??
        await safeCall(() => gcAny.getDailySummary?.(date))
      await delay(120)
      if (summary) {
        steps = summary.totalSteps ?? null
        caloriesActive = summary.activeKilocalories ?? null
        caloriesTotal = summary.totalKilocalories ?? null
        stressScore = summary.avgStressLevel ?? null
        restingHr = summary.restingHeartRate ?? null
        rawData.summary = summary
      }

      // --- Resting HR fallback ---
      if (!restingHr) {
        const hrData = await safeCall(() => gc.getHeartRate(date))
        await delay(120)
        restingHr = hrData?.restingHeartRate ?? null
        if (hrData) rawData.heartRate = hrData
      }

      // --- HRV ---
      const hrvData =
        await safeCall(() => gcAny.getHrv?.(date)) ??
        await safeCall(() => gcAny.getHRV?.(date))
      await delay(120)
      if (hrvData?.hrvSummary) {
        hrvMs = hrvData.hrvSummary.lastNight ?? hrvData.hrvSummary.weeklyAvg ?? null
        rawData.hrv = hrvData
      }

      // --- Compute composite readiness score ---
      let readinessScore: number | null = null
      let weightedSum = 0
      let totalWeight = 0

      if (sleepScore !== null) { weightedSum += sleepScore * 0.35; totalWeight += 0.35 }
      if (hrvMs !== null) {
        const normalized = Math.min(100, (hrvMs / 80) * 100)
        weightedSum += normalized * 0.30
        totalWeight += 0.30
      }
      if (bodyBatteryByDate[dateStr] !== undefined) {
        weightedSum += bodyBatteryByDate[dateStr] * 0.20
        totalWeight += 0.20
      }
      if (stressScore !== null) {
        weightedSum += (100 - stressScore) * 0.15
        totalWeight += 0.15
      }
      if (totalWeight >= 0.35) {
        readinessScore = Math.round(weightedSum / totalWeight)
      }

      // --- Save to database ---
      const { error: dbError } = await supabase.from("daily_metrics").upsert({
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
      }, { onConflict: "user_id,date" })

      if (!dbError) metricsSynced++
    }

    // Update credentials status
    await supabase
      .from("garmin_credentials")
      .update({ last_sync_at: new Date().toISOString(), sync_status: "success" })
      .eq("user_id", userId)

    // Update sync log
    if (syncLogId) {
      await supabase.from("sync_logs").update({
        status: "success",
        sessions_synced: sessionsSynced,
        metrics_synced: metricsSynced,
        completed_at: new Date().toISOString(),
      }).eq("id", syncLogId)
    }

    return new Response(
      JSON.stringify({ success: true, sessions_synced: sessionsSynced, metrics_synced: metricsSynced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Garmin sync failed:", msg)

    if (syncLogId) {
      await supabase.from("sync_logs").update({
        status: "error",
        error_message: msg,
        completed_at: new Date().toISOString(),
      }).eq("id", syncLogId).catch(() => {})
    }

    await supabase.from("garmin_credentials")
      .update({ sync_status: "error" })
      .eq("user_id", userId)
      .catch(() => {})

    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
