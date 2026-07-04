/**
 * 浏览器端获取 Supabase access token 的工具函数
 * Supabase JS v2 在 localStorage 中存储 JSON 对象 {currentSession: {access_token: "..."}}
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('supabase.auth.token');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.currentSession?.access_token || parsed?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * 创建带 Authorization header 的 fetch headers
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAccessToken();
  if (!token) return extra || {};
  return { Authorization: `Bearer ${token}`, ...extra };
}
