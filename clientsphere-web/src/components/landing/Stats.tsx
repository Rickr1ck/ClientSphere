import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

// Custom hook for animated counter
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(!startOnView)

  useEffect(() => {
    if (!startOnView) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true)
      },
      { threshold: 0.5 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [startOnView])

  useEffect(() => {
    if (!started) return
    
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      
      if (progress < 1) requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [end, duration, started])

  return { count, ref }
}

export default function Stats() {
  const stats = [
    { value: 10000, label: 'Active Users', suffix: '+' },
    { value: 500, label: 'Businesses', suffix: '+' },
    { value: 127, label: 'Average Growth', suffix: '%' },
    { value: 99, label: 'Uptime', suffix: '.9%' },
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-brand-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const { count, ref } = useCounter(stat.value)
            
            return (
              <motion.div
                key={i}
                ref={ref}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="backdrop-blur-xl bg-white/60 border border-white/60 rounded-2xl p-8 text-center shadow-lg"
              >
                <div className="text-4xl font-extrabold text-brand-600 mb-2">
                  {count.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-gray-700 font-medium">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
