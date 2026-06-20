'use client';

import { siteContent } from "@/data/content";
import { ArrowRight } from "lucide-react";

export default function Contact() {
  return (
    <section className="w-full py-40 flex flex-col justify-center relative z-10 mix-blend-plus-lighter">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 w-full text-center flex flex-col items-center">
        
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/30 mb-8 max-w-md mx-auto leading-relaxed">
          {siteContent.contact.subtitle}
        </span>
        
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter text-white mb-16">
          {siteContent.contact.title}
        </h2>
        
        <a 
          href={`mailto:${siteContent.contact.email}`}
          className="group flex items-center justify-center gap-4 px-10 py-5 rounded-full bg-white text-black font-bold text-[11px] tracking-[0.3em] uppercase hover:bg-white/90 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          INITIATE CONTACT
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        <div className="mt-40 w-full flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">
          <span>© 2026 SHAFWAN AHMED</span>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href={siteContent.contact.twitter} className="hover:text-white transition-colors">TWITTER</a>
            <a href={siteContent.contact.github} className="hover:text-white transition-colors">GITHUB</a>
            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              LINKEDIN <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
