import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fiiyveabpfpaumxtybvu.supabase.co',
  'sb_publishable_IinQXFb_Vetqhvg4bVxELQ_S450ikxn'
);

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex items-center space-x-4">
      <a href="/dashboard" className="text-gray-700 hover:text-indigo-600">控制台</a>
      {user ? (
        <>
          <span className="text-gray-600 text-sm">{user.email}</span>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            退出
          </button>
        </>
      ) : (
        <>
          <a href="/auth/login" className="text-gray-700 hover:text-indigo-600">登录</a>
          <a href="/auth/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">注册</a>
        </>
      )}
    </div>
  );
}