import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fiiyveabpfpaumxtybvu.supabase.co',
  'sb_publishable_IinQXFb_Vetqhvg4bVxELQ_S450ikxn'
);

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

  // Navigation links
  const navLinks = user ? (
    <>
      <a href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 rounded-md text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
        控制台
      </a>
      <span className="px-3 py-2 text-gray-500 text-sm hidden md:block">{user.email}</span>
      <button
        onClick={handleLogout}
        className="block w-full text-left md:w-auto px-3 py-2 text-gray-700 hover:text-red-600 rounded-md text-sm font-medium"
      >
        退出
      </button>
    </>
  ) : (
    <>
      <a href="/auth/login" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 rounded-md text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
        登录
      </a>
      <a href="/auth/register" className="block md:inline-block px-3 py-2 md:bg-indigo-600 md:text-white rounded-md text-sm font-medium hover:bg-indigo-700 text-gray-700 hover:text-indigo-600 md:hover:text-white" onClick={() => setMobileMenuOpen(false)}>
        注册
      </a>
    </>
  );

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center space-x-1">
        {navLinks}
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
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
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-40 py-2 px-4 space-y-1 animate-fade-in">
          <div className="flex flex-col">
            {navLinks}
          </div>
          {user && (
            <div className="pt-2 border-t border-gray-100">
              <span className="block px-3 py-1 text-xs text-gray-400">{user.email}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}