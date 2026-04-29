import { motion } from 'framer-motion'
import showcaseImage from '@/assets/img for landing page 2.png'
import { CheckCircle } from 'lucide-react'

export default function Showcase() {
  const capabilities = [
    'Automated lead scoring and routing',
    'Advanced campaign management',
    'Real-time collaboration tools',
    'Custom workflows and automations',
  ]

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <img src={showcaseImage} alt="ClientSphere Capabilities" className="rounded-2xl shadow-2xl w-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Powerful CRM capabilities at your fingertips
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            From lead management to customer success, ClientSphere provides everything your team needs to close more deals and build lasting relationships.
          </p>
          <ul className="space-y-4">
            {capabilities.map((cap, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle className="w-6 h-6 text-brand-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-base">{cap}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
