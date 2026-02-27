import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Zap, 
  Globe,
  Layout as LayoutIcon,
  Activity,
  Database,
  Pill
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">PharmaFlow <span className="text-indigo-400">Pro</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign in</Link>
            <Link 
              to="/login" 
              className="px-5 py-2.5 bg-white text-slate-950 rounded-full text-sm font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Next-Gen Pharmacy Intelligence
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
                Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">Pharmacy</span> with precision.
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-400 leading-relaxed mb-10 max-w-xl">
                The ultimate enterprise-grade platform for modern pharmacies. Real-time inventory tracking, intelligent POS, and advanced analytics in one beautiful interface.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 group"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all backdrop-blur-sm">
                  Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-white/5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Trusted by leading healthcare providers</p>
                <div className="flex flex-wrap items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="flex items-center gap-2 font-bold text-xl"><Activity className="w-6 h-6" /> MEDILINK</div>
                  <div className="flex items-center gap-2 font-bold text-xl"><ShieldCheck className="w-6 h-6" /> SECUREHEALTH</div>
                  <div className="flex items-center gap-2 font-bold text-xl"><Globe className="w-6 h-6" /> GLOBALCARE</div>
                </div>
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative perspective-1000"
            >
              {/* Main Dashboard Preview Card */}
              <div className="relative z-20 bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl shadow-indigo-500/10 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Mock UI Header */}
                <div className="flex items-center justify-between mb-8 p-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="w-32 h-2 bg-white/5 rounded-full" />
                </div>

                {/* Mock UI Content */}
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div className="space-y-4">
                    <div className="h-32 bg-white/5 rounded-3xl border border-white/5 p-4">
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg mb-4" />
                      <div className="w-2/3 h-2 bg-white/10 rounded-full mb-2" />
                      <div className="w-1/2 h-2 bg-white/5 rounded-full" />
                    </div>
                    <div className="h-48 bg-gradient-to-b from-white/5 to-transparent rounded-3xl border border-white/5 p-4">
                      <div className="flex justify-between items-end h-full gap-2">
                        {[40, 70, 45, 90, 65, 80].map((h, i) => (
                          <div key={i} className="flex-1 bg-indigo-500/40 rounded-t-lg" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-48 bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 mb-4" />
                      <div className="w-20 h-2 bg-white/10 rounded-full" />
                    </div>
                    <div className="h-32 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 p-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl mb-4 flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-3/4 h-2 bg-white/20 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 z-30 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth</p>
                    <p className="text-xl font-black">+24.8%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 z-30 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory</p>
                    <p className="text-xl font-black">12.4k</p>
                  </div>
                </div>
              </motion.div>

              {/* Decorative Shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full -z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-white/5 rounded-full -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid Snippet */}
      <section className="py-20 border-t border-white/5 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: LayoutIcon, title: "Intuitive Interface", desc: "Designed for speed and clarity in high-pressure environments." },
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Bank-grade encryption and comprehensive audit trails for every action." },
              { icon: Pill, title: "Real-time Sync", desc: "Instant updates across all terminals and mobile devices simultaneously." }
            ].map((feature, i) => (
              <div key={i} className="group">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="text-lg font-bold mb-3">{feature.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
