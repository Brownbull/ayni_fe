/**
 * Test Suite for Utility Functions
 */
import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate } from './utils'

describe('Utility Functions - Valid Tests', () => {
  it('valid: cn merges classes correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-500')
  })

  it('valid: formatCurrency formats Chilean pesos', () => {
    const result = formatCurrency(1000000)
    expect(result).toMatch(/1\.000\.000/)
  })

  it('valid: formatDate formats dates for Chilean locale', () => {
    const result = formatDate(new Date('2024-01-15'))
    expect(result).toBeTruthy()
  })
})

describe('Utility Functions - Edge Cases', () => {
  it('edge: cn handles undefined and null', () => {
    const result = cn('text-red-500', undefined, null, 'bg-blue-500')
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-500')
  })

  it('edge: formatCurrency handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toMatch(/0/)
  })

  it('edge: formatCurrency handles negative numbers', () => {
    const result = formatCurrency(-1000)
    expect(result).toMatch(/-1\.000/)
  })

  it('edge: formatDate handles string input', () => {
    const result = formatDate('2024-01-15')
    expect(result).toBeTruthy()
  })
})

describe('Utility Functions - Performance', () => {
  it('performance: cn executes quickly', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      cn('class1', 'class2', 'class3')
    }
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })

  it('performance: formatCurrency executes quickly', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      formatCurrency(1000000)
    }
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })
})
