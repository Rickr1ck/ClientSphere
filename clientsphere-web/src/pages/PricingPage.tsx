// src/pages/PricingPage.tsx
import { Link } from 'react-router-dom'
import logo from '@/assets/LogoWithName.png'

interface Plan {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 5 users',
      'Basic CRM features',
      'Lead management',
      'Email support',
      '5GB storage'
    ],
    cta: 'Get Started'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$79',
    description: 'For growing businesses that need more power',
    features: [
      'Up to 25 users',
      'Advanced CRM & pipeline',
      'AI-powered insights',
      'Marketing campaigns',
      'Priority support',
      '50GB storage',
      'Custom integrations'
    ],
    cta: 'Get Started',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    description: 'For large organizations with advanced needs',
    features: [
      'Unlimited users',
      'Full platform access',
      'Advanced AI & analytics',
      'Dedicated account manager',
      '24/7 premium support',
      'Unlimited storage',
      'Custom API access',
      'SLA guarantee'
    ],
    cta: 'Contact Sales'
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="ClientSphere" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link to="/register" className="h-9 px-4 inline-flex items-center justify-center bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-16 max-w-7xl mx-auto w-full text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
          Choose the plan that fits your business. All plans include a 14-day free trial.
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-8 shadow-sm hover:shadow-lg transition-all duration-300 ${
                plan.popular
                  ? 'border-brand-600 scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={`/register?plan=${plan.id}`}
                className={`w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center ${
                  plan.popular
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens after my 14-day trial?
              </h3>
              <p className="text-gray-600">
                After your trial ends, you'll need to subscribe to continue using the platform. Your data will be preserved for 30 days.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Join thousands of businesses using ClientSphere to grow their revenue.
          </p>
          <Link
            to="/register"
            className="h-12 px-8 inline-flex items-center justify-center bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-lg"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ClientSphere CRM. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
