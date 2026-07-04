/**
 * 浏览器端获取 Supabase access token 的工具函数
 *
 * Supabase JS v2 存储键名格式：sb-<project_ref>-auth-token
 * 例如：sb-fiiyveabpfpaumxtybvu-auth-token
 *
 * 兼容两种存储格式：
 * - v2 默认: sb-{ref}-auth-token → { currentSession: { access_token: "..." } }
 * - v1 遗留: supabase.auth.token → { currentSession: { access_token: "..." } } 或纯字符串
 */

const SUPABASE_URL = 'https://fiiyveabpfpaumxtybvu.supabase.co';
const PROJECT_REF = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

/** 可能的 localStorage 键名 */
const STORAGE_KEYS = [
  `sb-${PROJECT_REF}-auth-token`,   // v2 默认
  'supabase.auth.token',              // v1 遗留
];

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      // v2 格式: { currentSession: { access_token, ... }, expiresAt }
      if (parsed?.currentSession?.access_token) {
        return parsed.currentSession.access_token;
      }
      // 备用格式
      if (parsed?.access_token) {
        return parsed.access_token;
      }
    } catch {
      // 纯字符串 token（不太可能但兼容）
      if (raw.startsWith('eyJ') || raw.length > 100) {
        return raw;
      }
    }
  }

  return null;
}

/**
 * 创建带 Authorization header 的 fetch headers
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAccessToken();
  if (!token) return extra || {};
  return { Authorization: `Bearer ${token}`, ...extra };
}
