'use client';

import { motion } from 'framer-motion';
import { Droplets, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-600 h-8 w-8" />
            <span className="text-2xl font-bold tracking-tighter">Ammerli</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-6 py-2 font-medium hover:text-blue-600 transition">Login</Link>
            <Link href="/register" className="px-6 py-2 bg-black text-white rounded-full font-medium hover:bg-zinc-800 transition">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
        <div className="container mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium text-sm mb-8"
          >
            <Star className="h-4 w-4 fill-current" />
            <span>Trusted by 10,000+ households</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 max-w-4xl"
          >
            Pristine Water <br />
            <span className="text-blue-600">Delivered Instantly</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-zinc-600 max-w-2xl mb-12"
          >
            Experience the future of hydration. Ultra-fast delivery, real-time tracking, 
            and certified premium water sources right at your doorstep.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/register" className="px-10 py-5 bg-blue-600 text-white rounded-full text-lg font-bold hover:bg-blue-700 transition flex items-center gap-2">
              Order Now <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/how-it-works" className="px-10 py-5 bg-white border border-zinc-200 rounded-full text-lg font-bold hover:bg-zinc-50 transition">
              How it Works
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Zap, title: "Instant Dispatch", desc: "Our AI-powered matching ensures a driver is assigned in seconds." },
              { icon: ShieldCheck, title: "Certified Purity", desc: "Every drop is tested and certified to meet the highest health standards." },
              { icon: Droplets, title: "Bulk Options", desc: "From individual bottles to large tanks, we handle all volume requirements." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:shadow-xl transition-shadow"
              >
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Branding / Footer */}
      <footer className="mt-auto py-12 border-t bg-zinc-50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-600 h-6 w-6" />
            <span className="text-xl font-bold tracking-tighter">Ammerli</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 Ammerli Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-zinc-600 hover:text-black">Privacy</Link>
            <Link href="/terms" className="text-sm text-zinc-600 hover:text-black">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
