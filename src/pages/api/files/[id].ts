import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'File ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get material
    const { data: material, error: fetchError } = await supabase
      .from('reference_materials')
      .select('*, quizzes(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !material) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check ownership
    if (material.quizzes.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete from storage
    const filePath = material.file_url.split('/reference-materials/')[1];
    if (filePath) {
      await supabase.storage.from('reference-materials').remove([filePath]);
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('reference_materials')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'File deleted' }), {
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