import axios from 'axios';

const TOKEN_KEY = 'hanne_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Extract a human-readable message from an Axios error. */
export function apiError(e: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as { error?: string })?.error || e.message || fallback;
  }
  return fallback;
}

/** Absolute URL for an uploaded image path (works with the Vite proxy). */
export function imageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return path; // "/uploads/..." is proxied to the API in dev
}
