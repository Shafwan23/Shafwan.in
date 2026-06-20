'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, ArrowUpRight, Crosshair, Star, FileText, AlignLeft, Hexagon, Mail, Zap, Globe, Cpu, Shield } from 'lucide-react';
import AmbientCanvasWrapper from '@/components/layout/AmbientCanvasWrapper';

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */

const ecosystem = [
  { label: 'Portfolio', href: 'https://portfolio.shafwan.in', desc: 'Case studies & selected work', icon: Crosshair, accent: '#10b981' },
  { label: 'Ventures', href: 'https://projects.shafwan.in', desc: 'Active products & companies', icon: Star, accent: '#3b82f6' },
  { label: 'Log', href: 'https://cv.shafwan.in', desc: 'Execution history & timeline', icon: FileText, accent: '#818cf8' },
  { label: 'Essays', href: 'https://blog.shafwan.in', desc: 'Thinking on scale & systems', icon: AlignLeft, accent: '#f59e0b' },
  { label: 'Labs', href: 'https://labs.shafwan.in', desc: 'Deep tech research', icon: Hexagon, accent: '#d946ef' },
  { label: 'Contact', href: 'https://contact.shafwan.in', desc: 'Initiate protocol', icon: Mail, accent: '#06b6d4' },
];

const ventures = [
  {
    title: 'Nexus Infrastructure',
    type: 'System Architecture',
    year: '2026',
    description: 'A proprietary, high-performance computing environment built for massive scale, privacy, and intelligence.',
    status: 'Active',
    gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
  },
  {
    title: 'Aura Protocol',
    type: 'Spatial Web Engine',
    year: '2025',
    description: 'A decentralized protocol for rendering high-fidelity, interactive 3D spatial interfaces at global scale.',
    status: 'Active',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
  },
  {
    title: 'Meridian OS',
    type: 'Operating System',
    year: '2025',
    description: 'A next-generation operating system concept designed around local-first computation and ambient intelligence.',
    status: 'Research',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  },
];

const principles = [
  { word: 'Leverage', desc: 'Build once. Deploy everywhere. Multiply impact through systems.' },
  { word: 'Scale', desc: 'Architecture that serves one user or one billion without compromise.' },
  { word: 'Craft', desc: 'Every pixel, every function, every decision — deliberate.' },
  { word: 'Ambition', desc: 'The problems worth solving are the ones nobody else will touch.' },
];

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

export default function HomePage() {
  const missionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: missionScroll } = useScroll({
    target: missionRef,
    offset: ['start end', 'end start'],
  });
  const missionOpacity = useTransform(missionScroll, [0.15, 0.35], [0, 1]);
  const missionY = useTransform(missionScroll, [0.15, 0.35], [80, 0]);

  return (
    <div className="relative z-10 flex flex-col w-full">

      {/* ═══════════════════════════════════════
          HEADER
          ═══════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 px-6 md:px-12 py-5 flex justify-between items-center pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(2,2,16,0.8) 0%, rgba(2,2,16,0.4) 60%, transparent 100%)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center backdrop-blur-sm bg-white/[0.03]">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold tracking-[0.15em] text-white/90 uppercase">Shafwan Ahmed</span>
            <span className="text-[9px] tracking-[0.25em] text-white/35 uppercase">Digital Headquarters</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-10 pointer-events-auto">
          <a href="#mission" className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase hover:text-white/80 transition-colors duration-300">Mission</a>
          <a href="#ecosystem" className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase hover:text-white/80 transition-colors duration-300">Ecosystem</a>
          <a href="#ventures" className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase hover:text-white/80 transition-colors duration-300">Ventures</a>
          <a href="#principles" className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase hover:text-white/80 transition-colors duration-300">Principles</a>
          <a href="#connect" className="text-[10px] font-medium tracking-[0.15em] text-black uppercase bg-white/90 hover:bg-white px-5 py-2 rounded-full transition-all duration-300">Connect</a>
        </nav>
      </header>


      {/* ═══════════════════════════════════════
          VIEWPORT 1 — HERO
          ═══════════════════════════════════════ */}
      <section className="relative w-full min-h-screen flex flex-col justify-between px-6 md:px-12 lg:px-20 pt-28 pb-12 overflow-hidden">
        {/* Background Artifact for Hero only */}
        <AmbientCanvasWrapper />

        {/* Top content row */}
        <div className="w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8 lg:mt-16 relative z-10">
          {/* Left — Name & positioning */}
          <div className="lg:col-span-5 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/40">Est. 2024 — Building the future</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-[-0.04em] text-white leading-[0.9] mb-8">
                SHAFWAN<br />AHMED
              </h1>

              <p className="text-lg md:text-xl text-white/60 font-light leading-relaxed max-w-md mb-10">
                Building systems, products, and ventures designed to <span className="text-white font-normal">scale beyond their creators</span>.
              </p>

              <a href="#ecosystem" className="group inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-all duration-500">
                <span className="w-8 h-px bg-white/20 group-hover:w-12 group-hover:bg-white/50 transition-all duration-500" />
                Explore the ecosystem
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </motion.div>
          </div>

          {/* Center — intentionally empty for the 3D artifact to dominate */}
          <div className="lg:col-span-3 hidden lg:block" />

          {/* Right — Quote & operating context */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-end gap-12 pt-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-sm"
            >
              <div className="border-l border-white/10 pl-6">
                <span className="text-3xl text-white/15 font-serif leading-none block mb-3">&ldquo;</span>
                <p className="text-xl text-white/80 font-light leading-relaxed">
                  The best way to predict the future is to <span className="italic text-cyan-400 font-medium">build it</span>.
                </p>
                <span className="text-[9px] tracking-[0.25em] text-white/30 uppercase mt-4 block">— Peter Drucker</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-3 h-3">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-40 animate-ping" />
                  <span className="relative block w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-emerald-400">Systems Online</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/40 tracking-wider uppercase">Focus</span>
                  <span className="text-white/70 font-mono">Spatial Computing</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/40 tracking-wider uppercase">Stack</span>
                  <span className="text-white/70 font-mono">React 19 · R3F · Edge</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/40 tracking-wider uppercase">Status</span>
                  <span className="text-white/70 font-mono">Shipping</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom — Navigation modules */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[1500px] mx-auto mt-auto pt-16 relative z-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ecosystem.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="group glass-panel rounded-2xl p-4 transition-all duration-500 flex flex-col gap-3 relative overflow-hidden"
                  style={{ '--node-accent': item.accent } as React.CSSProperties}
                >
                  {/* Hover glow background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${item.accent}18 0%, transparent 70%)` }} />
                  {/* Top edge light */}
                  <div className="absolute top-0 left-[20%] right-[20%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${item.accent}60, transparent)` }} />
                  <div className="relative z-10">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg"
                      style={{
                        borderColor: `${item.accent}30`,
                        boxShadow: `0 0 15px ${item.accent}15`,
                      }}
                    >
                      <Icon className="w-4 h-4 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_currentColor]" style={{ color: item.accent }} />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <span className="text-[11px] font-semibold tracking-[0.1em] text-white/90 uppercase block mb-0.5">{item.label}</span>
                    <span className="text-[9px] text-white/35 font-medium leading-tight block group-hover:text-white/50 transition-colors duration-500">{item.desc}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════
          01 — THE MISSION
          ═══════════════════════════════════════ */}
      <section id="mission" ref={missionRef} className="relative w-full min-h-screen flex items-center justify-center py-32 lg:py-40">
        <div className="section-divider absolute top-0 left-0 right-0" />

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 text-center flex flex-col items-center relative z-10">
          <motion.div style={{ opacity: missionOpacity, y: missionY }}>
            <span className="text-[10px] font-semibold tracking-[0.4em] uppercase text-indigo-400/70 mb-12 block">01 — The Mission</span>

            <h2 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-[-0.03em] text-white/90 leading-[1.1] mb-8">
              Building <span className="gradient-text font-semibold">leverage</span> through
            </h2>
            <h2 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-[-0.03em] text-white/90 leading-[1.1] mb-8">
              technology, design, and
            </h2>
            <h2 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-[-0.03em] text-white/90 leading-[1.1]">
              <span className="text-white font-semibold">systems thinking</span>.
            </h2>

            <div className="mt-16 flex items-center gap-6 justify-center">
              <span className="w-16 h-px bg-gradient-to-r from-transparent to-white/15" />
              <p className="text-sm text-white/35 font-medium tracking-wide max-w-md">
                Every system I build is designed to compound — to create more value over time than the effort required to build it.
              </p>
              <span className="w-16 h-px bg-gradient-to-l from-transparent to-white/15" />
            </div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          02 — THE ECOSYSTEM
          ═══════════════════════════════════════ */}
      <section id="ecosystem" className="relative w-full py-32 lg:py-40">
        <div className="section-divider absolute top-0 left-0 right-0" />

        <div className="max-w-[1500px] mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.4em] uppercase text-indigo-400/70 mb-4 block">02 — The Ecosystem</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white/90">
                Connected systems. <span className="text-white font-medium">One vision.</span>
              </h2>
            </div>
            <p className="text-sm text-white/35 font-medium max-w-sm leading-relaxed">
              Six interconnected domains forming a unified digital infrastructure.
            </p>
          </div>

          {/* Ecosystem grid — large interactive nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ecosystem.map((item, i) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="group glass-panel-strong rounded-3xl p-8 md:p-10 transition-all duration-700 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                >
                  {/* Background glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 30% 20%, ${item.accent}20 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${item.accent}10 0%, transparent 40%)` }}
                  />
                  {/* Top edge shimmer */}
                  <div className="absolute top-0 left-[10%] right-[10%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${item.accent}50, transparent)` }} />
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 grid-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110"
                        style={{
                          borderColor: `${item.accent}25`,
                          boxShadow: `0 0 20px ${item.accent}10`,
                          background: `${item.accent}08`,
                        }}
                      >
                        <Icon className="w-5 h-5 transition-all duration-500 group-hover:drop-shadow-[0_0_8px_currentColor]" style={{ color: item.accent }} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-500" />
                    </div>

                    <h3 className="text-xl font-semibold tracking-tight text-white mb-2">{item.label}</h3>
                    <p className="text-sm text-white/40 font-medium group-hover:text-white/55 transition-colors duration-500">{item.desc}</p>
                  </div>

                  <div className="relative z-10 mt-8 pt-6 border-t border-white/5 group-hover:border-white/10 transition-colors duration-500">
                    <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/25 group-hover:text-white/50 transition-colors duration-500">
                      {item.label.toLowerCase()}.shafwan.in →
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          03 — SELECTED VENTURES
          ═══════════════════════════════════════ */}
      <section id="ventures" className="relative w-full py-32 lg:py-40">
        <div className="section-divider absolute top-0 left-0 right-0" />

        <div className="max-w-[1500px] mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.4em] uppercase text-indigo-400/70 mb-4 block">03 — Selected Ventures</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white/90">
                What I&apos;m <span className="text-white font-medium">building</span>.
              </h2>
            </div>
            <a href="#" className="group flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-white/40 hover:text-white transition-colors duration-300">
              View all ventures
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {ventures.map((v, i) => (
              <div
                key={i}
                className="group glass-panel-strong rounded-3xl p-8 md:p-10 relative overflow-hidden hover:border-white/15 transition-all duration-700 flex flex-col justify-between min-h-[380px]"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${v.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                {/* Top edge shimmer */}
                <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                {/* Subtle grid overlay */}
                <div className="absolute inset-0 grid-overlay opacity-[0.3] pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'Active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`} />
                      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/40">{v.status}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/25">{v.year}</span>
                  </div>

                  <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-indigo-400/60 mb-3 block">{v.type}</span>
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-4 leading-tight">{v.title}</h3>
                  <p className="text-sm text-white/40 font-medium leading-relaxed group-hover:text-white/55 transition-colors duration-500">{v.description}</p>
                </div>

                <div className="relative z-10 mt-8 flex justify-end">
                  <div className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-black transition-colors duration-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          04 — PRINCIPLES
          ═══════════════════════════════════════ */}
      <section id="principles" className="relative w-full py-32 lg:py-40">
        <div className="section-divider absolute top-0 left-0 right-0" />

        <div className="max-w-[1500px] mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-20">
            <span className="text-[10px] font-semibold tracking-[0.4em] uppercase text-indigo-400/70 mb-4 block">04 — Principles</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white/90">
              What I <span className="text-white font-medium">believe</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-3xl overflow-hidden">
            {principles.map((p, i) => (
              <div key={i} className="bg-[#020210] p-10 md:p-12 flex flex-col justify-between min-h-[280px] group hover:bg-white/[0.02] transition-all duration-700 relative overflow-hidden">
                {/* Ambient breathing glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 80%, rgba(99,102,241,0.08) 0%, transparent 60%)` }} />
                <div>
                  <span className="text-[10px] font-mono text-white/15 mb-8 block group-hover:text-indigo-400/40 transition-colors duration-500">0{i + 1}</span>
                  <h3 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-4">{p.word}<span className="text-indigo-400">.</span></h3>
                </div>
                <p className="text-sm text-white/35 font-medium leading-relaxed group-hover:text-white/50 transition-colors duration-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          05 — CONNECT
          ═══════════════════════════════════════ */}
      <section id="connect" className="relative w-full py-40 lg:py-52">
        <div className="section-divider absolute top-0 left-0 right-0" />

        <div className="max-w-[1000px] mx-auto px-6 md:px-12 text-center flex flex-col items-center relative z-10">
          <span className="text-[10px] font-semibold tracking-[0.4em] uppercase text-indigo-400/70 mb-8 block">05 — Connect</span>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[-0.03em] text-white/90 leading-[1.1] mb-6">
            The next satisfying thing I build
          </h2>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[-0.03em] text-white/90 leading-[1.1] mb-12">
            could be <span className="text-white font-semibold">yours</span>.
          </h2>

          <p className="text-sm text-white/35 font-medium max-w-md mb-12 leading-relaxed">
            Available for strategic partnerships, venture collaborations, and high-impact work that pushes boundaries.
          </p>

          <a
            href="mailto:hello@shafwan.in"
            className="group inline-flex items-center gap-4 px-10 py-4 rounded-full bg-white text-black font-semibold text-[11px] tracking-[0.2em] uppercase hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] transition-all duration-500"
          >
            Initiate Contact
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
      <footer className="relative w-full py-10 px-6 md:px-12">
        <div className="section-divider absolute top-0 left-0 right-0" />

        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <span className="text-[9px] font-medium tracking-[0.25em] uppercase text-white/25">© 2026 Shafwan Ahmed. All rights reserved.</span>
          <div className="flex items-center gap-8">
            <a href="https://twitter.com" className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors duration-300">Twitter</a>
            <a href="https://github.com" className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors duration-300">GitHub</a>
            <a href="#" className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors duration-300">LinkedIn</a>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          </div>
        </div>
      </footer>

    </div>
  );
}
