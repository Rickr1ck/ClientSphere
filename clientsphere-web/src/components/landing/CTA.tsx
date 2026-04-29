import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-16 text-center shadow-2xl overflow-hidden"
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-indigo-400/20 blur-3xl" />
          
          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6">
              Start Growing Your Business Today
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of businesses already using ClientSphere to scale their operations and boost revenue.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-14 px-10 bg-white text-brand-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
