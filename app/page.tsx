'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { StickySection } from '@/components/sticky-section';
import { MaturityStack } from '@/components/maturity-stack';
import { techStack } from '@/lib/landingPage/data';
import {
  PenTool,
  Sparkles,
  SquareDashedMousePointerIcon,
  Mic,
  Cpu,
  Lock,
  ArrowDown,
  Feather,
  Github,
  Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HelpButton } from '@/components/help-button';


const App: React.FC = () => {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroY = useTransform(scrollY, [0, 300], [0, 100]);
  const [activeTech, setActiveTech] = useState<number | null>(null);

  return (
    <div className="bg-paper text-ink min-h-screen selection:bg-black selection:text-white">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 px-6 py-2 flex justify-between items-center z-50 mix-blend-difference text-white pointer-events-none backdrop-blur-sm">
        <div className="font-serif font-bold text-xl pointer-events-auto cursor-pointer">Co-Author</div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href="/sessions">
            <Button variant="outline" className='rounded-none text-primary font-serif font-bold'>Start Writing</Button>
          </Link>
          <a href="https://github.com/ElkanHub/Co-Author-Google-Hackathon" className="hover:opacity-70 transition-opacity"><Github size={20} /></a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="text-center max-w-4xl mx-auto z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6 flex justify-center"
          >
            <div className="h-px w-24 bg-ink mb-8" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-8xl font-serif font-light mb-8 tracking-tight"
          >
            Silence is <br />
            <span className="italic font-medium">Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-lg md:text-xl font-sans text-subtle max-w-xl mx-auto leading-relaxed"
          >
            An autonomous AI writing partner that earns the right to interrupt.
            <br />
            Built with Gemini 3.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-12 animate-bounce text-subtle"
        >
          <ArrowDown size={24} />
        </motion.div>
      </header>

      {/* Inspiration Section */}
      <StickySection className="bg-white">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto px-6 items-center">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4 block">The Inspiration</span>
            <h2 className="text-black/90 text-3xl md:text-4xl font-serif font-bold mb-8 leading-tight">
              Real collaboration isn't loud. <br /> It's intentional.
            </h2>
            <div className="prose prose-lg text-subtle font-serif">
              <p className="mb-6">
                Most AI writing tools feel like an overexcited intern—constantly interrupting, flooding the screen with suggestions, and breaking flow.
              </p>
              <p>
                The inspiration behind <strong className="text-ink">Co-Author</strong> came from a simple question:
                <em> What if AI behaved like a disciplined, thoughtful co-author instead of a reactive chatbot?</em>
              </p>
              <p className="mt-4 border-l-4 border-black pl-4 italic text-ink">
                "I wanted silence to mean intelligence, and intervention to mean value."
              </p>
            </div>
          </div>
          <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {/* Abstract visual for "Noise vs Silence" */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent" />
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-8 bg-white shadow-xl rounded-sm max-w-xs z-10 border border-gray-100"
            >
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                <div className="h-2 bg-gray-200 rounded w-4/6"></div>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "40%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-2 bg-blue-500 rounded"
                ></motion.div>
              </div>
              <div className="mt-4 text-xs text-gray-400 font-mono">
                &gt; Analyzing intent...<br />
                &gt; High relevance (0.92)<br />
                &gt; Suggesting edit...
              </div>
            </motion.div>
          </div>
        </div>
      </StickySection>

      {/* What it Does (Features) */}
      <section className="py-32 px-6 bg-paper">
        <div className="max-w-6xl mx-auto">
          <div className="text-black/90 grid md:grid-cols-3 gap-8 mb-24">
            <FeatureCard
              icon={<Feather size={32} />}
              title="Autonomous Partner"
              desc="Observes writing in real-time, contributing only when genuinely useful using a Notion-style research editor."
            />
            <FeatureCard
              icon={<Cpu size={32} />}
              title="Context Engine"
              desc="Treats the entire document as living context, allowing for deep analysis and paraphrasing without hijacking."
            />
            <FeatureCard
              icon={<Mic size={32} />}
              title="Real-time Voice"
              desc="Talk through ideas while the AI quietly handles background research using WebSockets & AudioWorklets."
            />
          </div>

          {/* Step In Feature Highlight */}
          <div className="mb-32 mt-16 p-12 bg-zinc-900 text-white rounded-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <SquareDashedMousePointerIcon size={200} />
            </div>
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                  Hand over the pen. <br />
                  <span className="italic font-medium text-gray-200 underline">Step In Mode.</span>
                </h2>
                <p className="text-gray-400 text-lg font-light mb-8 leading-relaxed">
                  Delegated authorship with complete transparency. For the first time, hand over full editorial control to an AI that thinks, plans, executes, and self-critiques—just like a human co-author.
                </p>
                <div className="flex gap-4">
                  <Link href="/sessions">
                    <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black rounded-none font-serif font-bold px-8">Try Step In</Button>
                  </Link>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-6 rounded-none border-[10px] border-white/5 backdrop-blur-[2px]">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-sm mb-1 uppercase tracking-wider text-white-300">Planning</h4>
                      <p className="text-xs text-gray-400">Reads your instructions and formulates a deep editorial strategy.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-sm mb-1 uppercase tracking-wider text-white-300">Execution</h4>
                      <p className="text-xs text-gray-400">Rewrites, continues, or polishes your work directly in the editor.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-sm mb-1 uppercase tracking-wider text-white-300">Evaluation</h4>
                      <p className="text-xs text-gray-400">Self-evaluates the output against your goals and finds weak points.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">4</div>
                    <div>
                      <h4 className="font-bold text-sm mb-1 uppercase tracking-wider text-white-300">Refinement</h4>
                      <p className="text-xs text-gray-400">Makes final surgical adjustments to ensure absolute perfection.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <MaturityStack />
        </div>
      </section>

      {/* Tech Stack & How Built */}
      <section className="py-32 bg-ink text-paper relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          {/* Grid pattern */}
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <h2 className="text-4xl font-serif font-bold mb-6">Built for Performance</h2>
            <p className="text-gray-400 max-w-2xl text-lg font-light">
              Real-time systems demand real engineering. Shortcuts in audio, scheduling, or buffering always surface as UX problems.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {techStack.map((tech, idx) => (
              <motion.div
                key={tech.name}
                onMouseEnter={() => setActiveTech(idx)}
                onMouseLeave={() => setActiveTech(null)}
                className={`p-6 rounded border transition-all duration-300 cursor-default ${activeTech === idx
                  ? 'border-white bg-white/10'
                  : 'border-white/10 hover:border-white/30'
                  }`}
              >
                <h3 className="text-xl font-bold font-sans mb-1">{tech.name}</h3>
                <p className="text-sm text-gray-400">{tech.role}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 grid md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Lock className="text-gray-400" /> Security First
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Preventing prompt injection was critical. I implemented a security layer that actively blocks jailbreak attempts while allowing "Shadow Prompts" for intent scanning.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Mic className="text-gray-400" /> Audio Engineering
              </h3>
              <p className="text-gray-400 leading-relaxed">
                To solve jitter and buffering, I moved playback logic off the main thread entirely using AudioWorklets, achieving smooth, uninterrupted audio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learnings & Future */}
      <section className="py-32 px-6 bg-paper">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg mx-auto">
            <h2 className="text-4xl font-serif font-bold text-center mb-12">Reflection</h2>

            <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 mb-16">
              <h3 className="text-xl font-bold font-sans uppercase tracking-widest text-subtle mb-6">What I Learned</h3>
              <p className="font-serif text-xl leading-loose text-ink">
                "I learned that good AI UX is more about <span className="bg-yellow-100 px-1">restraint</span> than raw intelligence. Latency, silence, and timing matter just as much as model quality. Users trust AI more when it behaves like a collaborator, not a performer."
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 font-serif">What's Next?</h3>
                <ul className="space-y-4 text-subtle font-sans">
                  <li className="flex gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    Multi-document reasoning & cross-paper citation mapping.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    Refining the voice agent into a true thinking partner.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    Collaborative modes for teams.
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <p className="text-subtle font-serif italic border-l-2 border-gray-200 pl-6 py-2">
                  Long-term, Co-Author aims to become the standard environment where humans and AI co-write — calmly, deliberately, and at scale.
                </p>
                <Link href="https://github.com/Co-Author/Co-Author" target="_blank" className="text-primary font-serif font-bold"><Button variant="outline" className="rounded-none">Check Out the Repo <Github size={16} /></Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className=" text-black/90 bg-white py-12 border-t border-gray-100 text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">Co-Author</h2>
        <p className="text-subtle text-sm">Built with precision. Powered by Gemini.</p>
        <HelpButton />

      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="p-8 bg-white rounded-none shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
    <div className="mb-6 text-ink">{icon}</div>
    <h3 className="text-xl font-bold font-sans mb-3">{title}</h3>
    <p className="text-subtle leading-relaxed font-serif text-sm">{desc}</p>
  </div>
);

export default App;