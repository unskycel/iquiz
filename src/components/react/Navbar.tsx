import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fiiyveabpfpaumxtybvu.supabase.co',
  'sb_publishable_IinQXFb_Vetqhvg4bVxELQ_S450ikxn'
);

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={dark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return <div className="flex items-center space-x-4 h-16" />;
  }

  const navLinks = user ? (
    <>
      <a href="/dashboard" className="block px-3 py-2 text-muted-foreground hover:text-primary rounded-md text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
        控制台
      </a>
      <span className="px-3 py-2 text-muted-foreground text-sm hidden md:block">{user.email}</span>
      <button
        onClick={handleLogout}
        className="block w-full text-left md:w-auto px-3 py-2 text-muted-foreground hover:text-destructive rounded-md text-sm font-medium transition-colors"
      >
        退出
      </button>
    </>
  ) : (
    <>
      <a href="/auth/login" className="block px-3 py-2 text-muted-foreground hover:text-primary rounded-md text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
        登录
      </a>
      <a href="/auth/register" className="block md:inline-block px-3 py-2 md:bg-primary md:text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 text-muted-foreground hover:text-primary md:hover:text-primary-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
        注册
      </a>
    </>
  );

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center space-x-1">
        {navLinks}
        <ThemeToggle />
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center space-x-1">
        <ThemeToggle />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
          aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border shadow-lg z-40 py-2 px-4 space-y-1 animate-fade-in">
          <div className="flex flex-col">
            {navLinks}
          </div>
          {user && (
            <div className="pt-2 border-t border-border">
              <span className="block px-3 py-1 text-xs text-muted-foreground">{user.email}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
