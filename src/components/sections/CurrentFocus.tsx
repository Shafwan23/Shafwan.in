'use client';

import { Activity, Cpu, Network, Radar, Zap } from 'lucide-react';

export default function CurrentFocus() {
  return (
    <section className="w-full py-32 flex flex-col justify-center relative z-10 mix-blend-plus-lighter">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Command Display */}
          <div className="lg:col-span-8 bg-black/20 border border-white/10 rounded-3xl p-10 md:p-14 backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-16 relative z-10">
              <div className="relative flex items-center justify-center w-4 h-4">
                <span className="absolute w-full h-full rounded-full bg-emerald-500 opacity-50 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-400">SYSTEM ARCHITECTURE // ACTIVE</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white/90 leading-[1.2] mb-20 max-w-3xl relative z-10">
              Currently architecting <span className="font-bold text-white">spatial computing infrastructure</span> and exploring deep tech human-computer interaction.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-[10px] tracking-[0.3em] uppercase font-bold text-white">INFRASTRUCTURE</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  Developing proprietary local-first systems and scalable architecture for the next generation of the web.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <Radar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-[10px] tracking-[0.3em] uppercase font-bold text-white">RESEARCH</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  Pushing the boundaries of spatial rendering, WebGL protocols, and immersive digital environments.
                </p>
              </div>
            </div>
          </div>

          {/* Telemetry / Live Stats Panel */}
          <div className="lg:col-span-4 bg-black/20 border border-white/10 rounded-3xl p-10 backdrop-blur-2xl flex flex-col relative overflow-hidden">
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 mb-12 block flex items-center gap-2">
              <Activity className="w-3 h-3" /> NETWORK TELEMETRY
            </span>
            
            <ul className="space-y-8 flex-grow flex flex-col justify-center relative z-10">
              <li className="flex justify-between items-end border-b border-white/5 pb-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-white/40 tracking-[0.2em] uppercase">SYSTEM LOAD</span>
                  <span className="text-white font-mono text-sm tracking-widest">OPTIMAL</span>
                </div>
                <Zap className="w-4 h-4 text-amber-400" />
              </li>
              <li className="flex justify-between items-end border-b border-white/5 pb-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-white/40 tracking-[0.2em] uppercase">FRAMEWORK</span>
                  <span className="text-white font-mono text-sm tracking-widest">REACT 19 / R3F</span>
                </div>
                <Network className="w-4 h-4 text-blue-400" />
              </li>
              <li className="flex justify-between items-end border-b border-white/5 pb-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-white/40 tracking-[0.2em] uppercase">DEPLOYMENT</span>
                  <span className="text-white font-mono text-sm tracking-widest">EDGE COMPUTE</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] mb-1" />
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
