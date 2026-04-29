import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import heroImage from '@/assets/img for landing page.png'
import { ArrowRight, Play } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Scale Your Business with <span className="text-brand-600">Intelligent CRM</span> Solutions
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            Streamline sales pipelines, automate workflows, and unlock AI-powered insights to grow your enterprise faster.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-14 px-8 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="inline-flex items-center gap-2 h-14 px-8 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all border border-gray-300 shadow-md hover:shadow-lg">
              <Play className="w-5 h-5" /> Book Demo
            </button>
          </div>
          
          {/* Trust badges */}
          <div className="mt-12 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
          </div>
        </motion.div>

        {/* Right: Hero image with floating glass cards */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <img src={heroImage} alt="ClientSphere Platform" className="rounded-2xl shadow-2xl w-full" />
          
          {/* Floating glass card 1 - Active Users */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -left-6 backdrop-blur-xl bg-white/70 border border-white/60 rounded-xl p-4 shadow-xl"
          >
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Active Users</div>
            <div className="text-2xl font-bold text-brand-600">10,000+</div>
          </motion.div>

          {/* Floating glass card 2 - Growth Rate */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1, ease: "easeInOut" }}
            className="absolute -top-6 -right-6 backdrop-blur-xl bg-white/70 border border-white/60 rounded-xl p-4 shadow-xl"
          >
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Growth Rate</div>
            <div className="text-2xl font-bold text-green-600">+127%</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
