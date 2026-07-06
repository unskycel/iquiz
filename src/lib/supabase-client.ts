import { createClient } from '@supabase/supabase-js';

/**
 * 共享 Supabase 浏览器端客户端
 * 从 Astro 环境变量读取配置，避免硬编码
 *
 * 环境变量：
 * - SUPABASE_URL: Supabase 项目 URL
 * - SUPABASE_ANON_KEY: Supabase 匿名密钥（publishable key）
 *
 * 注意：Astro 默认会将所有环境变量注入 import.meta.env，
 * 但只有 PUBLIC_ 前缀的变量会在客户端代码中可用。
 * 这里通过 vite define 在 astro.config.mjs 中手动暴露。
 */
const SUPABASE_URL = import.meta.env.SUPABASE_URL ?? 'https://fiiyveabpfpaumxtybvu.supabase.co';
const SUPABASE_KEY = import.meta.env.SUPABASE_ANON_KEY ?? 'sb_publishable_IinQXFb_Vetqhvg4bVxELQ_S450ikxn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
