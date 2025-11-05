import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          {/* More routes will be added in subsequent tasks */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Welcome Page Component
function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="card p-12 text-center space-y-6">
          <h1 className="text-5xl font-bold text-primary-600">
            AYNI
          </h1>
          <p className="text-xl text-gray-600">
            Plataforma de Analítica para PYMEs Chilenas
          </p>
          <div className="pt-6 space-y-3 text-left">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Checkmark">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-700">Backend configurado con Django + PostgreSQL + Redis</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Checkmark">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-700">Frontend configurado con React + TypeScript + Tailwind CSS</p>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Checkmark">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-700">Docker Compose listo para desarrollo</p>
            </div>
          </div>
          <div className="pt-6 border-t">
            <p className="text-sm text-gray-500">
              ✨ Project structure complete! Ready for feature development.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
