import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

// ─── Sentry ───────────────────────────────────────────────────────────────────
// Set VITE_SENTRY_DSN in Railway env vars to enable error monitoring
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,        // 20% of transactions traced
    replaysOnErrorSampleRate: 1.0, // Capture full replay on errors
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
}

// ─── React Query ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30s: data considered fresh
      gcTime: 5 * 60 * 1000,       // 5min: garbage collect unused cache
      retry: 1,                    // Retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  </StrictMode>,
)
