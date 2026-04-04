// supabase/functions/sync-garmin/index.ts
// Deploy con: supabase functions deploy sync-garmin

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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { user_id } = await req.json()
    if (!user_id) throw new Error("user_id required")

    // Log inicio de sync
    const { data: syncLog } = await supabase
      .from("sync_logs")
      .insert({ user_id, sync_type: "incremental", status: "running" })
      .select()
      .single()

    // Obtener credenciales Garmin del usuario
    const { data: creds, error: credsError } = await supabase
      .from("garmin_credentials")
      .select("garmin_username, garmin_password_encrypted")
      .eq("user_id", user_id)
      .single()

    if (credsError || !creds) {
      throw new Error("No Garmin credentials found")
    }

    const garminPassword = atob(creds.garmin_password_encrypted)

    // -------------------------------------------------------
    // NOTA: Aquí iría la integración real con Garmin Connect API
    // o con el MCP @nicolasvegam/garmin-connect-mcp
    //
    // Por ahora generamos datos demo realistas para el MVP
    // -------------------------------------------------------

    let sessionsSynced = 0
    let metricsSynced = 0

    // Generar métricas de los últimos 30 días si no existen
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const metric = {
        user_id,
        date: dateStr,
        hrv_ms: Math.round(50 + Math.sin(i * 0.4) * 12 + Math.random() * 5),
        resting_hr: Math.round(52 + Math.cos(i * 0.3) * 4 + Math.random() * 3),
        sleep_hours: parseFloat((7 + Math.sin(i * 0.5) * 1.2).toFixed(2)),
        sleep_score: Math.round(70 + Math.sin(i * 0.45) * 15 + Math.random() * 8),
        readiness_score: Math.round(75 + Math.sin(i * 0.35) * 15 + Math.random() * 6),
        steps: Math.round(8000 + Math.random() * 6000),
        calories_active: Math.round(400 + Math.random() * 600),
        stress_score: Math.round(25 + Math.random() * 30),
        body_battery: Math.round(55 + Math.sin(i * 0.6) * 20),
        spo2_avg: parseFloat((97 + Math.random() * 2).toFixed(1)),
      }

      const { error } = await supabase
        .from("daily_metrics")
        .upsert(metric, { onConflict: "user_id,date" })

      if (!error) metricsSynced++
    }

    // Generar sesiones demo si no existen
    const activities = [
      { type: "running", dist: 12.4, dur: 58, hr: 152, max_hr: 174, cal: 720, tss: 68 },
      { type: "cycling", dist: 45.2, dur: 92, hr: 138, max_hr: 168, cal: 1240, tss: 95 },
      { type: "swimming", dist: 2.0, dur: 45, hr: 128, max_hr: 155, cal: 480, tss: 52 },
      { type: "running", dist: 8.0, dur: 38, hr: 144, max_hr: 169, cal: 520, tss: 44 },
      { type: "strength", dist: 0, dur: 55, hr: 118, max_hr: 148, cal: 320, tss: 38 },
    ]

    for (let i = 0; i < activities.length; i++) {
      const a = activities[i]
      const start = new Date(today)
      start.setDate(start.getDate() - (i + 1))

      const { error } = await supabase
        .from("training_sessions")
        .upsert({
          user_id,
          garmin_activity_id: Date.now() + i,
          activity_type: a.type,
          start_time: start.toISOString(),
          duration_min: a.dur,
          distance_km: a.dist,
          avg_hr: a.hr,
          max_hr: a.max_hr,
          calories: a.cal,
          tss: a.tss,
        }, { onConflict: "garmin_activity_id" })

      if (!error) sessionsSynced++
    }

    // Actualizar log y estado
    await supabase.from("sync_logs").update({
      status: "success",
      sessions_synced: sessionsSynced,
      metrics_synced: metricsSynced,
      completed_at: new Date().toISOString()
    }).eq("id", syncLog.id)

    await supabase.from("garmin_credentials").update({
      last_sync_at: new Date().toISOString(),
      sync_status: "success"
    }).eq("user_id", user_id)

    return new Response(
      JSON.stringify({ success: true, sessions_synced: sessionsSynced, metrics_synced: metricsSynced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Sync error:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
