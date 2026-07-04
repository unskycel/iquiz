import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabase-server';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, displayName } = await request.json();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (authData.user) {
      // Create user profile in our users table
      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email,
        display_name: displayName,
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return new Response(JSON.stringify({ user: authData.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};