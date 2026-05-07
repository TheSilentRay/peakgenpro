// Shared cache version — incremented after every Garmin sync.
// Each dashboard page compares its cached version against this;
// if stale, it clears its local cache and re-fetches from Supabase.
let _version = 0
export const getCacheVersion = () => _version
export const invalidateCaches = () => { _version++ }
