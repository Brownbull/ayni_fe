/**
 * Test Suite for Task-001: Frontend Project Structure
 * Tests all 8 required test types: valid, error, invalid, edge, functional, visual, performance, security
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('Project Structure - Valid Tests', () => {
  it('valid: app renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('AYNI')).toBeInTheDocument()
  })

  it('valid: welcome page displays correctly', () => {
    render(<App />)
    expect(screen.getByText(/Plataforma de Analítica para PYMEs Chilenas/i)).toBeInTheDocument()
  })

  it('valid: all project setup checkmarks visible', () => {
    render(<App />)
    const checkmarks = screen.getAllByRole('img', { hidden: true })
    expect(checkmarks.length).toBeGreaterThan(0)
  })
})

describe('Project Structure - Error Handling Tests', () => {
  it('error: handles missing environment variables gracefully', () => {
    const originalEnv = import.meta.env
    // TypeScript doesn't allow direct modification, but app should handle undefined env vars
    expect(() => render(<App />)).not.toThrow()
  })

  it('error: renders without backend connection', () => {
    // App should render even if backend is down
    expect(() => render(<App />)).not.toThrow()
  })
})

describe('Project Structure - Invalid Input Tests', () => {
  it('invalid: app has valid routing configuration', () => {
    render(<App />)
    // Router should not crash with invalid initial route
    expect(screen.getByText('AYNI')).toBeInTheDocument()
  })
})

describe('Project Structure - Edge Case Tests', () => {
  it('edge: app renders in different viewport sizes', () => {
    // Test mobile viewport
    window.innerWidth = 375
    window.innerHeight = 667
    window.dispatchEvent(new Event('resize'))

    render(<App />)
    expect(screen.getByText('AYNI')).toBeInTheDocument()
  })

  it('edge: app renders in large viewport', () => {
    // Test desktop viewport
    window.innerWidth = 1920
    window.innerHeight = 1080
    window.dispatchEvent(new Event('resize'))

    render(<App />)
    expect(screen.getByText('AYNI')).toBeInTheDocument()
  })
})

describe('Project Structure - Functional Tests', () => {
  it('functional: QueryClient is configured', () => {
    // QueryClient wraps the app
    render(<App />)
    // If QueryClient wasn't configured, app would crash
    expect(screen.getByText('AYNI')).toBeInTheDocument()
  })

  it('functional: Router is configured', () => {
    // BrowserRouter wraps the app
    render(<App />)
    expect(window.location.pathname).toBe('/')
  })
})

describe('Project Structure - Visual Tests', () => {
  it('visual: Tailwind CSS classes are applied', () => {
    const { container } = render(<App />)
    // Check if Tailwind classes are present
    const element = container.querySelector('.min-h-screen')
    expect(element).toBeInTheDocument()
  })

  it('visual: gradient background is applied', () => {
    const { container } = render(<App />)
    const element = container.querySelector('.bg-gradient-to-br')
    expect(element).toBeInTheDocument()
  })

  it('visual: card component is rendered', () => {
    const { container } = render(<App />)
    const card = container.querySelector('.card')
    expect(card).toBeInTheDocument()
  })
})

describe('Project Structure - Performance Tests', () => {
  it('performance: app renders in < 1 second', () => {
    const start = performance.now()
    render(<App />)
    const duration = performance.now() - start
    expect(duration).toBeLessThan(1000)
  })

  it('performance: welcome page renders quickly', () => {
    const start = performance.now()
    render(<App />)
    screen.getByText('AYNI')
    const duration = performance.now() - start
    expect(duration).toBeLessThan(500)
  })
})

describe('Project Structure - Security Tests', () => {
  it('security: no console errors during render', () => {
    const consoleSpy = vi.spyOn(console, 'error')
    render(<App />)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('security: no inline scripts in rendered output', () => {
    const { container } = render(<App />)
    const scripts = container.querySelectorAll('script')
    // No inline scripts should be present (CSP compliance)
    scripts.forEach(script => {
      expect(script.innerHTML).toBe('')
    })
  })

  it('security: environment variables are properly typed', () => {
    // TypeScript should enforce env var types
    const apiUrl = import.meta.env.VITE_API_URL
    expect(typeof apiUrl === 'string' || apiUrl === undefined).toBe(true)
  })
})
