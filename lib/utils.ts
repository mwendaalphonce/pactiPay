import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility
export function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Month/Year utilities for payroll
export function getMonthYear(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7) // Returns YYYY-MM format
}

export function formatMonthYear(monthYear: string): string {
  const date = new Date(monthYear + '-01')
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long'
  })
}

// Validation utilities
export function validateKraPin(pin: string): boolean {
  const kraRegex = /^[A-Z][0-9]{9}[A-Z]$/
  return kraRegex.test(pin)
}

export function validateNationalId(id: string): boolean {
  // Basic validation - should be 8 digits for most Kenyan IDs
  return /^\d{8}$/.test(id)
}

export function validateBankAccount(account: string): boolean {
  // Basic validation - should be numeric and reasonable length
  return /^\d{8,16}$/.test(account)
}

// Number utilities
export function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value.replace(/,/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

export function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'An unknown error occurred'
}

// Local storage utilities (with error handling)
export function getFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setToStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Silent fail - storage not available
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Silent fail - storage not available
  }
}