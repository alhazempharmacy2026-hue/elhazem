import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// راجع .env.example — لو محطتش VITE_MAP_STYLE_URL هيستخدم ستايل ديمو عام (تغطية عالمية محدودة
// التفاصيل) لحد ما تجيب مفتاح من مزوّد خرائط زي MapTiler.
const FALLBACK_STYLE = 'https://demotiles.maplibre.org/style.json'

export default function TrackingMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const styleUrl = import.meta.env.VITE_MAP_STYLE_URL || FALLBACK_STYLE
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: 14,
    })
    mapRef.current = map
    markerRef.current = new maplibregl.Marker({ color: '#0f9d6e' }).setLngLat([lng, lat]).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    markerRef.current?.setLngLat([lng, lat])
    mapRef.current?.easeTo({ center: [lng, lat] })
  }, [lat, lng])

  return <div ref={containerRef} className="h-64 w-full rounded-2xl border border-[var(--border)]" />
}
