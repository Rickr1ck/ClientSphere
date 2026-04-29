// src/lib/api.ts
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'

// Validate production API URL is configured to prevent silent routing failures
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  throw new Error("VITE_API_URL is required in production environment");
}

// Lazy import to avoid circular dependency between api.ts and authStore.ts.
// authStore imports api.ts — if api.ts imported authStore at module level it
// would create a circular reference that breaks Vite's module graph.
const getToken = (): string | null => {
  try {
    const raw = localStorage.getItem('clientsphere-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: string } }
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

const redirectToLogin = (): void => {
  // Clear persisted auth state and redirect without importing the store
  localStorage.removeItem('clientsphere-auth')
  window.location.href = '/login'
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/v1` 
    : '/api/v1',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — force logout and redirect
      redirectToLogin()
    }
    return Promise.reject(error)
  },
)

export default api