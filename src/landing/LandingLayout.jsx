import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LandingNav from './components/landing/LandingNav';
import LandingFooter from './components/landing/LandingFooter';
import { ArrowUp } from 'lucide-react';

export default function LandingLayout({ children }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const isChatPage = location.pathname === '/chat' || location.pathname === '/trial-chat';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-200 relative selection:bg-blue-600/30 selection:text-blue-200 overflow-x-hidden">
      {/* Subtle Tech Cyber Grid Pattern with Radial Vignette */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      {/* Global Navigation (hidden on dedicated trial chat page) */}
      {!isChatPage && <LandingNav />}

      {/* Main Content */}
      <main className={isChatPage ? "h-screen flex flex-col overflow-hidden" : ""}>
        {children || <Outlet />}
      </main>

      {/* Global Footer (hidden on dedicated trial chat page) */}
      {!isChatPage && <LandingFooter />}

      {/* Floating Scroll to Top Button */}
      {!isChatPage && showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl glass-panel border border-blue-500/30 text-blue-300 hover:text-white hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95 animate-in fade-in zoom-in"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

