import React from 'react';
import { motion } from 'framer-motion';
import { maturityLayers } from '@/lib/landingPage/data';
import { Layers, ShieldCheck, ZapOff } from 'lucide-react';

export const MaturityStack: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-6">
          <Layers className="w-6 h-6 text-gray-700" />
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-4">The 7-Layer Maturity Stack</h2>
        <p className="text-subtle font-sans max-w-xl mx-auto">
          Most AI writes too much. This stack is designed to teach the AI when 
          <span className="italic font-serif text-ink"> not</span> to speak.
        </p>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-4 md:ml-0 space-y-12 md:space-y-0">
        {maturityLayers.map((layer, index) => (
          <motion.div
            key={layer.level}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="md:flex items-start md:pl-12 relative group"
          >
            {/* Timeline dot */}
            <div className="absolute -left-[9px] top-0 md:top-1 w-4 h-4 rounded-full bg-white border-4 border-gray-300 group-hover:border-black transition-colors duration-300 z-10" />
            
            {/* Number (Background) */}
            <div className="absolute -left-12 top-0 text-6xl font-serif text-gray-100 -z-10 select-none hidden md:block group-hover:text-gray-200 transition-colors">
              {layer.level}
            </div>

            <div className="pl-8 md:pl-0">
              <h3 className="text-xl font-bold font-sans text-ink mb-2 group-hover:text-blue-600 transition-colors">
                {layer.name}
              </h3>
              <p className="text-subtle leading-relaxed font-serif">
                {layer.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-16 flex flex-wrap justify-center gap-4 text-sm font-sans text-gray-500">
        <span className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-none border border-gray-100">
            <ZapOff size={16} /> Enforces Cooldowns
        </span>
        <span className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-none border border-gray-100">
            <ShieldCheck size={16} /> Validates Intent
        </span>
      </div>
    </div>
  );
};