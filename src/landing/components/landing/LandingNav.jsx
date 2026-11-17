import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Presentation,
  Image as ImageIcon,
  Film,
  MessageSquare,
  Cpu,
  Terminal,
  CreditCard,
  Globe,
} from 'lucide-react';

export default function LandingNav() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studiosOpen, setStudiosOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#070709]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/60 py-3.5'
          : 'bg-[#070709]/30 backdrop-blur-md border-b border-white/[0.04] py-4'
      }`}
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* ── Brand Logo: Clean Single Line (No PRO tag, No Subtitle) ── */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 p-[1.5px] shadow-sm shadow-blue-500/20 group-hover:border-blue-400/50 transition-all shrink-0">
            <div className="w-full h-full bg-[#090b12] rounded-[10px] flex items-center justify-center p-1.5 overflow-hidden">
              <img
                src="/image.png"
                alt="NetRoot AI"
                className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white flex items-center">
            NetRoot&nbsp;<span className="text-blue-500">AI</span>&nbsp;<span className="text-slate-200 font-semibold text-base">ChatBix</span>
          </span>
        </Link>

        {/* ── Desktop Navigation: Clean, Open & Unboxed (No Capsule, No Clutter) ── */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-xs sm:text-sm font-medium">
          {/* Studios Dropdown */}
          <div className="relative" onMouseLeave={() => setStudiosOpen(false)}>
            <button
              onMouseEnter={() => setStudiosOpen(true)}
              onClick={() => setStudiosOpen(!studiosOpen)}
              className={`flex items-center gap-1.5 py-1.5 transition-colors cursor-pointer ${
                location.pathname.startsWith('/showcase/') || location.pathname === '/video-studio' || location.pathname === '/image-studio' || location.pathname === '/ppt-studio'
                  ? 'text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Studios</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  studiosOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {studiosOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 p-1.5 rounded-2xl bg-[#0c0f18] border border-white/10 shadow-2xl shadow-black z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  to="/video-studio"
                  onClick={() => setStudiosOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Video Studio</span>
                </Link>

                <Link
                  to="/showcase/image"
                  onClick={() => setStudiosOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Image Studio</span>
                </Link>

                <Link
                  to="/showcase/ppt"
                  onClick={() => setStudiosOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <Presentation className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">PPT Studio</span>
                </Link>

                <Link
                  to="/chat"
                  onClick={() => setStudiosOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-slate-200 hover:text-white transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Trial Chat</span>
                </Link>
              </div>
            )}
          </div>

          <NavLink
            to="/models"
            className={({ isActive }) =>
              `py-1.5 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`
            }
          >
            Models Fleet
          </NavLink>

          <NavLink
            to="/developers"
            className={({ isActive }) =>
              `py-1.5 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`
            }
          >
            Developer API
          </NavLink>

          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              `py-1.5 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`
            }
          >
            Pricing & Wallet
          </NavLink>

          <NavLink
            to="/about-us"
            className={({ isActive }) =>
              `py-1.5 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`
            }
          >
            About Us
          </NavLink>
        </nav>

        {/* ── Action CTAs: Clean & Symmetrical ── */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                Sign In
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Launch Studio Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Menu Toggle Button ── */}
        <div className="flex lg:hidden items-center gap-2">
          {user ? (
            <Link
              to="/dashboard"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm"
            >
              Launch Free
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/5"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown Drawer ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden mx-4 mt-3 p-4 rounded-2xl glass-panel border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-4 bg-[#0c0f18]/95 backdrop-blur-xl shadow-2xl">
          <Link
            to="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 font-semibold"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Trial Chat (7 Free Prompts)
            </span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </Link>

          <Link
            to="/video-studio"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400" />
              Video Studio (Full HD Cinema)
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            to="/showcase/image"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-200"
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              Image Studio (High Resolution)
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            to="/showcase/ppt"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Presentation className="w-4 h-4 text-blue-400" />
              PPT Studio (Slide Decks)
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            to="/models"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              Models Fleet (470+)
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            to="/developers"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              Developer API Gateway
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-200"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              Pricing & Wallet
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            to="/about-us"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              About Us (NetRoot.AI)
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>

          <div className="pt-2 border-t border-white/10 flex gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 py-2.5 text-center text-xs font-semibold rounded-xl bg-white/5 text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 py-2.5 text-center text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
