import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAccessToken, authHeaders } from './auth-client';

// ─── localStorage mock ─────────────────────────────────────
function mockLocalStorage(store: Record<string, string> = {}) {
  const ls = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    get length() { return Object.keys(store).length; },
  };
  Object.defineProperty(window, 'localStorage', {
    value: ls,
    configurable: true,
    writable: true,
  });
  return ls;
}

const V2_KEY = 'sb-fiiyveabpfpaumxtybvu-auth-token';
const V1_KEY = 'supabase.auth.token';

beforeEach(() => {
  mockLocalStorage();
});

// ─── getAccessToken ────────────────────────────────────────
describe('getAccessToken', () => {
  it('SSR 环境（无 window）→ null', () => {
    // jsdom 环境下 window 存在，模拟删除
    const originalWindow = globalThis.window;
    // @ts-expect-error 模拟 SSR
    delete globalThis.window;
    expect(getAccessToken()).toBeNull();
    // 恢复
    globalThis.window = originalWindow;
  });

  it('localStorage 为空 → null', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('v2 格式: sb-<ref>-auth-token → { currentSession: { access_token } }', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token-v2';
    mockLocalStorage({
      [V2_KEY]: JSON.stringify({
        currentSession: { access_token: token },
        expiresAt: Date.now() + 3600000,
      }),
    });
    expect(getAccessToken()).toBe(token);
  });

  it('v1 遗留格式: supabase.auth.token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token-v1';
    mockLocalStorage({
      [V1_KEY]: JSON.stringify({
        currentSession: { access_token: token },
      }),
    });
    expect(getAccessToken()).toBe(token);
  });

  it('备用格式: { access_token } 直接在顶层', () => {
    const token = 'top-level-token';
    mockLocalStorage({
      [V2_KEY]: JSON.stringify({ access_token: token }),
    });
    expect(getAccessToken()).toBe(token);
  });

  it('纯字符串 JWT（以 eyJ 开头）', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.pure-string-jwt';
    mockLocalStorage({
      [V2_KEY]: token,
    });
    expect(getAccessToken()).toBe(token);
  });

  it('JSON 解析失败且不以 eyJ 开头 → null', () => {
    mockLocalStorage({
      [V2_KEY]: 'not-json-not-jwt',
    });
    expect(getAccessToken()).toBeNull();
  });

  it('v2 优先于 v1（两个键都有时取 v2）', () => {
    mockLocalStorage({
      [V2_KEY]: JSON.stringify({ currentSession: { access_token: 'v2-token' } }),
      [V1_KEY]: JSON.stringify({ currentSession: { access_token: 'v1-token' } }),
    });
    expect(getAccessToken()).toBe('v2-token');
  });

  it('v2 不存在时回退到 v1', () => {
    mockLocalStorage({
      [V1_KEY]: JSON.stringify({ currentSession: { access_token: 'v1-token' } }),
    });
    expect(getAccessToken()).toBe('v1-token');
  });

  it('currentSession 存在但 access_token 为空 → null', () => {
    mockLocalStorage({
      [V2_KEY]: JSON.stringify({ currentSession: {} }),
    });
    expect(getAccessToken()).toBeNull();
  });
});

// ─── authHeaders ───────────────────────────────────────────
describe('authHeaders', () => {
  it('无 token → 返回 extra（空对象）', () => {
    expect(authHeaders()).toEqual({});
  });

  it('无 token + extra → 返回 extra', () => {
    expect(authHeaders({ 'Content-Type': 'application/json' })).toEqual({
      'Content-Type': 'application/json',
    });
  });

  it('有 token → 包含 Authorization Bearer', () => {
    const token = 'my-test-token-123';
    mockLocalStorage({
      [V2_KEY]: JSON.stringify({ currentSession: { access_token: token } }),
    });
    expect(authHeaders()).toEqual({
      Authorization: `Bearer ${token}`,
    });
  });

  it('有 token + extra → 合并（Authorization 在前）', () => {
    const token = 'my-test-token-456';
    mockLocalStorage({
      [V2_KEY]: JSON.stringify({ currentSession: { access_token: token } }),
    });
    const result = authHeaders({ 'Content-Type': 'application/json' });
    expect(result).toHaveProperty('Authorization', `Bearer ${token}`);
    expect(result).toHaveProperty('Content-Type', 'application/json');
    expect(Object.keys(result)).toHaveLength(2);
  });
});
