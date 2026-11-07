import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/inter'
import { ApiError, wakeUpApi } from './api/client'
import { AuthProvider } from './context/authProvider'
import App from './App'
import './index.css'

// Starts waking up the API (it sleeps when idle) while the page loads
wakeUpApi()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry network and server errors twice (useful while the API wakes up),
      // but never retry answers like "forbidden" or "not found"
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)