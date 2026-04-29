// src/pages/LandingPage.tsx
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Showcase from '@/components/landing/Showcase'
import Stats from '@/components/landing/Stats'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Showcase />
      <Stats />
      <CTA />
      <Footer />
    </div>
  )
}
