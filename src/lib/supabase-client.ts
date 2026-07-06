import { createClient } from '@supabase/supabase-js';

/**
 * 共享 Supabase 浏览器端客户端
 * 避免多个组件各自 createClient 导致重复实例
 */
const SUPABASE_URL = 'https://fiiyveabpfpaumxtybvu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IinQXFb_Vetqhvg4bVxELQ_S450ikxn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
