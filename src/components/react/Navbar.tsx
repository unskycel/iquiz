import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';

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
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={dark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {dark ? (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
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
    return (
      <div className="flex items-center space-x-2 h-16">
        <div className="w-16 h-8 bg-muted/50 rounded animate-pulse" />
        <ThemeToggle />
      </div>
    );
  }

  const navLinkClass = "block px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const navLinks = user ? (
    <>
      <a href="/dashboard" className={`${navLinkClass} text-muted-foreground hover:text-primary hover:bg-primary-light`} onClick={() => setMobileMenuOpen(false)}>
        控制台
      </a>
      <a href="/progress" className={`${navLinkClass} text-muted-foreground hover:text-primary hover:bg-primary-light`} onClick={() => setMobileMenuOpen(false)}>
        学习进度
      </a>
      <a href="/history" className={`${navLinkClass} text-muted-foreground hover:text-primary hover:bg-primary-light`} onClick={() => setMobileMenuOpen(false)}>
        答题历史
      </a>
      <a href="/wrong-answers" className={`${navLinkClass} text-muted-foreground hover:text-primary hover:bg-primary-light`} onClick={() => setMobileMenuOpen(false)}>
        错题集
      </a>
      <span className="hidden md:block px-3 py-2 text-sm text-muted-foreground/80 max-w-[180px] truncate">{user.email}</span>
      <button
        onClick={handleLogout}
        className={`${navLinkClass} text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-left w-full md:w-auto`}
      >
        退出
      </button>
    </>
  ) : (
    <>
      <a href="/auth/login" className={`${navLinkClass} text-muted-foreground hover:text-primary hover:bg-primary-light`} onClick={() => setMobileMenuOpen(false)}>
        登录
      </a>
      <a
        href="/auth/register"
        className="btn-primary text-sm px-4 py-2"
        onClick={() => setMobileMenuOpen(false)}
      >
        注册
      </a>
    </>
  );

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center space-x-1">
        {navLinks}
        <div className="w-px h-6 bg-border mx-1"></div>
        <ThemeToggle />
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center space-x-1">
        <ThemeToggle />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 glass border-b border-border/40 shadow-large z-40 py-3 px-4 animate-slide-down">
          <div className="flex flex-col gap-1">
            {navLinks}
          </div>
          {user && (
            <div className="pt-2 mt-2 border-t border-border/40">
              <span className="block px-3 py-1 text-xs text-muted-foreground/80 truncate">{user.email}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
