import { useState, useEffect } from 'react'
export default function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= bp : false)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= bp)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return mobile
}
