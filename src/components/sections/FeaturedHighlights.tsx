'use client';

import { siteContent } from "@/data/content";
import { ArrowRight, Server } from "lucide-react";

export default function FeaturedHighlights() {
  return (
    <section className="w-full py-32 flex flex-col justify-center relative z-10 mix-blend-plus-lighter">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 w-full">
        
        <div className="flex justify-between items-end mb-16 border-b border-white/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-indigo-400 mb-1 block">INFRASTRUCTURE LOG</span>
              <h2 className="text-2xl font-light tracking-wide text-white">FEATURED VENTURES</h2>
            </div>
          </div>
          <button className="hidden md:flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors group">
            VIEW FULL ARCHIVE
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {siteContent.featuredHighlights.map((highlight, index) => (
            <div 
              key={index} 
              className="group relative bg-black/40 border border-white/10 rounded-3xl p-10 overflow-hidden backdrop-blur-2xl hover:border-white/30 transition-all duration-700"
            >
              {/* Animated Background Gradient */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br ${index === 0 ? 'from-indigo-500/10 to-transparent' : 'from-cyan-500/10 to-transparent'}`} />
              
              <div className="relative z-10 flex flex-col h-full min-h-[300px] justify-between">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">{highlight.type}</span>
                    <span className="text-[10px] font-mono text-white/30">{highlight.year}</span>
                  </div>
                  
                  <h3 className="text-3xl font-light tracking-tight text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/50 transition-all duration-500">
                    {highlight.title}
                  </h3>
                  
                  <p className="text-sm text-white/50 font-medium leading-relaxed max-w-sm">
                    {highlight.description}
                  </p>
                </div>

                <div className="flex justify-between items-end mt-12">
                  <div className="flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-emerald-500">ONLINE</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                    <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
