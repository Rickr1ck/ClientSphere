import { motion } from 'framer-motion'
import { BarChart3, Users, Bot, Shield, TrendingUp, CreditCard } from 'lucide-react'

const features = [
  { icon: BarChart3, title: 'Pipeline Management', desc: 'Visualize your sales funnel and track deals with intuitive drag-and-drop.' },
  { icon: Users, title: 'Customer 360', desc: 'Get a complete view of every customer interaction and history.' },
  { icon: Bot, title: 'AI Insights', desc: 'Predict conversion rates and identify high-value leads automatically.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Multi-tenant isolation with RBAC for maximum data protection.' },
  { icon: TrendingUp, title: 'Real-time Analytics', desc: 'Make data-driven decisions with live dashboards and reports.' },
  { icon: CreditCard, title: 'Billing & Invoices', desc: 'Automate billing cycles and manage subscriptions effortlessly.' },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to scale</h2>
          <p className="text-xl text-gray-600">Enterprise-grade features built for modern teams</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(83, 74, 183, 0.15)' }}
              className="backdrop-blur-lg bg-white/50 border border-gray-200/60 rounded-2xl p-8 hover:border-brand-300 transition-all cursor-default"
            >
              <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
