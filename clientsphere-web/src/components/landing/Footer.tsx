import { Link } from 'react-router-dom'
import logo from '@/assets/LogoWithName.png'
import { Twitter, Linkedin, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-gray-200 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand column */}
          <div>
            <img src={logo} alt="ClientSphere" className="h-10 w-auto mb-4" />
            <p className="text-sm text-gray-600 leading-relaxed">
              The intelligent CRM platform for modern enterprises. Scale your business with AI-powered insights.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#features" className="hover:text-brand-600 transition-colors">Features</a></li>
              <li><Link to="/pricing" className="hover:text-brand-600 transition-colors">Pricing</Link></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Demo</a></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-brand-600 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Contact links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="mailto:hello@clientsphere.com" className="hover:text-brand-600 transition-colors">hello@clientsphere.com</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Support</a></li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ClientSphere CRM. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
