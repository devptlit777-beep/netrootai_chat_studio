import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Search, ArrowLeft, Sparkles } from 'lucide-react';
import { helpSections } from '../../data/helpSections';

const GROUPS = [...new Set(helpSections.map((s) => s.group))];

export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('introduction');
  const navigate = useNavigate();

  const query = search.trim().toLowerCase();
  const visibleSections = helpSections.filter(
    (s) =>
      s.title.toLowerCase().includes(query) ||
      s.summary.toLowerCase().includes(query) ||
      s.steps.some((step) => step.toLowerCase().includes(query))
  );

  const navigateTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 pt-20">
      <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* ── Left Sidebar Navigation ── */}
        <aside className="hidden border-r border-white/[0.08] bg-[#090b12]/90 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col px-4 py-6">
            {/* Search Box */}
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-slate-300 focus-within:border-blue-500/50 transition-colors">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documentation..."
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500 font-sans"
              />
            </label>

            {/* Navigation Groups */}
            <nav className="mt-6 space-y-6 overflow-y-auto pr-1 flex-1">
              {GROUPS.map((group) => {
                const groupSections = visibleSections.filter((s) => s.group === group);
                if (!groupSections.length) return null;
                return (
                  <div key={group}>
                    <h3 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {group}
                    </h3>
                    <div className="space-y-1">
                      {groupSections.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => navigateTo(s.id)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                            activeSection === s.id
                              ? 'bg-blue-600/15 text-blue-300 border-l-2 border-blue-500 font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {visibleSections.length === 0 && (
                <p className="px-2 text-xs text-slate-500">No matching topics found.</p>
              )}
            </nav>

            {/* Bottom Back Button */}
            <div className="mt-auto border-t border-white/10 pt-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-blue-400 hover:bg-white/[0.05] rounded-xl transition-all w-full"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Documentation Content & Right TOC ── */}
        <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,820px)_200px] xl:justify-center xl:gap-10">
          <main className="min-w-0 px-6 py-10 sm:px-10 lg:px-12 xl:px-6">
            {/* Breadcrumb Header */}
            <div className="mb-8 flex items-center gap-2 text-xs text-slate-400 font-mono">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span>Netroot AI ChatBix Docs</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-blue-300">Documentation & User Guide</span>
            </div>

            {/* Introduction Section */}
            <header id="introduction" className="scroll-mt-24 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-blue-500/30 text-[11px] font-semibold text-blue-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Netroot AI ChatBix Official Guide</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Netroot AI ChatBix Platform Guide
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
                Comprehensive documentation for Netroot AI ChatBix: multi-model conversational AI, autonomous plugins, executive 16:9 presentation generation, and creative FLUX 4K image generation.
              </p>
              <div className="rounded-2xl border border-blue-500/25 bg-blue-950/20 p-4 text-xs leading-relaxed text-blue-200/90">
                <strong className="text-blue-300 font-semibold">Unified Studio Workspace:</strong> All capabilities—including fast open-weight models, Presentation Studio, and Image Studio—operate seamlessly under a single account without requiring external subscriptions.
              </div>
            </header>

            {/* Quickstart Heading */}
            <section className="mt-12" aria-labelledby="quickstart-heading">
              <h2 id="quickstart-heading" className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Quickstart: Getting Started in 3 Steps</span>
              </h2>
              <ol className="list-decimal space-y-3 pl-6 text-sm text-slate-300 leading-relaxed font-normal">
                <li>Select a model and start a conversation in the Chat workspace with optional file attachments and plugins.</li>
                <li>Design an executive slide deck in Presentation Studio by describing your topic and theme, then export to .pptx.</li>
                <li>Manage API keys, rate limits, and custom BYOK upstream keys in your Workspace console.</li>
              </ol>
            </section>

            <div className="my-10 border-t border-white/10" />

            {/* Dynamic Sections */}
            <div className="space-y-14">
              {helpSections.slice(1).map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                  <div className="text-[11px] font-mono uppercase text-blue-400 tracking-wider">
                    {section.group}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {section.summary}
                  </p>
                  <ol className="list-decimal space-y-2.5 pl-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {section.steps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ol>
                  {section.details?.map((detail, dIdx) => (
                    <div
                      key={dIdx}
                      className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300 leading-relaxed"
                    >
                      {detail}
                    </div>
                  ))}
                  {index < helpSections.length - 2 && <div className="mt-12 border-t border-white/10" />}
                </section>
              ))}
            </div>

            {/* Footer */}
            <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 font-mono">
              <span>Netroot AI ChatBix • Documentation & User Reference</span>
              <span>Updated for 2026/2027 Standards</span>
            </footer>
          </main>

          {/* ── Right "On This Page" Table of Contents ── */}
          <aside className="sticky top-24 hidden h-fit pt-6 xl:block" aria-label="On this page">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              On This Page
            </h4>
            <nav className="space-y-1 border-l border-white/10">
              {[{ id: 'quickstart-heading', title: 'Quickstart' }, ...helpSections.map(({ id, title }) => ({ id, title }))].map(
                (item) => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`block w-full border-l-2 -ml-px px-3 py-1.5 text-left text-xs transition-colors ${
                      activeSection === item.id ||
                      (item.id === 'quickstart-heading' && activeSection === 'introduction')
                        ? 'border-blue-500 text-blue-300 font-medium'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.title}
                  </button>
                )
              )}
            </nav>
          </aside>
        </div>
      </div>
    </div>
  );
}
