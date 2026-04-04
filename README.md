# ⚡ PeakGenPro

Plataforma SaaS de rendimiento deportivo con IA para atletas que usan Garmin.

## Stack
- **Frontend**: React + Recharts + CSS-in-JS
- **Auth + DB**: Supabase (`tkaouqqubptjeklgcnpj`)
- **AI Coach**: Claude API (claude-sonnet-4-20250514)
- **Datos deportivos**: Garmin Connect MCP / API
- **Deploy**: Vercel

---

## 🚀 Deploy en 5 pasos

### 1. Clonar e instalar
```bash
git clone <tu-repo>
cd peakgenpro
npm install
```

### 2. Variables de entorno
Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

Rellena los valores:
```
VITE_SUPABASE_URL=https://tkaouqqubptjeklgcnpj.supabase.co
VITE_SUPABASE_ANON_KEY=<tu_anon_key>   # Supabase Dashboard → Settings → API
ANTHROPIC_API_KEY=<tu_api_key>          # console.anthropic.com
```

### 3. Ejecutar SQL en Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/tkaouqqubptjeklgcnpj)
2. SQL Editor → New Query
3. Copia y ejecuta el contenido de `supabase/schema.sql`

### 4. Deploy en Vercel
```bash
npm install -g vercel
vercel

# En Vercel Dashboard → Settings → Environment Variables, añade:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

### 5. Deploy Edge Function (opcional para sync real)
```bash
npm install -g supabase
supabase login
supabase link --project-ref tkaouqqubptjeklgcnpj
supabase functions deploy sync-garmin
supabase secrets set ANTHROPIC_API_KEY=<tu_api_key>
```

---

## 📁 Estructura del proyecto

```
peakgenpro/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx        # Navegación lateral
│   │   └── AppLayout.jsx      # Layout con sidebar
│   ├── pages/
│   │   ├── Landing.jsx        # Landing con waitlist → Supabase
│   │   ├── Login.jsx          # Auth real con Supabase
│   │   ├── Register.jsx       # Registro 4 pasos
│   │   ├── GarminConnect.jsx  # Conexión Garmin
│   │   ├── Dashboard.jsx      # KPIs, charts, AI insight
│   │   ├── Training.jsx       # Sesiones, zonas HR, TSS
│   │   ├── Recovery.jsx       # HRV, sueño, body battery
│   │   ├── Nutrition.jsx      # Macros, hidratación, comidas
│   │   ├── AICoach.jsx        # Chat con Claude + datos reales
│   │   └── Profile.jsx        # Perfil y objetivos
│   ├── lib/
│   │   ├── supabase.js        # Cliente Supabase + helpers
│   │   ├── useAuth.jsx        # Auth context hook
│   │   └── demoData.js        # Datos demo para fallback
│   └── styles/
│       └── global.css         # Design tokens + utilidades
├── supabase/
│   ├── schema.sql             # ← EJECUTAR ESTO en Supabase
│   └── functions/
│       └── sync-garmin/
│           └── index.ts       # Edge Function Garmin sync
├── vercel.json                # Config SPA rewrites
└── .env.example               # Template de variables
```

---

## 🔌 Tablas Supabase

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfil extendido del atleta |
| `waitlist` | Emails de beta (público insert) |
| `garmin_credentials` | Credenciales encriptadas |
| `training_sessions` | Actividades de Garmin |
| `daily_metrics` | HRV, sueño, readiness diario |
| `sync_logs` | Log de sincronizaciones |

---

## 🧠 AI Coach

El chat en `/coach` usa `claude-sonnet-4-20250514` con:
- Datos reales del atleta inyectados en el system prompt
- Métricas de los últimos 14 días
- Historial de sesiones recientes
- Fallback a datos demo si Supabase no está conectado

**IMPORTANTE**: La API key de Anthropic está llamada desde el cliente en el MVP.
Para producción, mueve la llamada a una Supabase Edge Function o API Route de Vercel.

---

## 🔒 Seguridad (para producción)

- [ ] Mover `ANTHROPIC_API_KEY` al backend (Edge Function)
- [ ] Encriptar credenciales Garmin con `pgcrypto` en Supabase
- [ ] Implementar rate limiting en el chat AI
- [ ] Añadir Supabase Auth email confirmation

---

## 📍 URLs de producción

- App: `https://peakgenpro.vercel.app`
- Supabase: `https://tkaouqqubptjeklgcnpj.supabase.co`
- Edge Functions: `https://tkaouqqubptjeklgcnpj.functions.supabase.co`
