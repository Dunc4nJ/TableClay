"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * SSR-safe localStorage hook with automatic JSON serialization
 * Persists state to localStorage and syncs across tabs
 *
 * @param key - The localStorage key
 * @param initialValue - Default value if no stored value exists
 * @returns [storedValue, setValue] - Current value and setter function
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // After hydration, read from localStorage
  useEffect(() => {
    setIsHydrated(true)
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  // Listen for changes in other tabs and same-tab custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage change for "${key}":`, error)
        }
      }
    }

    // Custom event for same-tab updates
    const handleLocalStorageUpdate = (e: CustomEvent) => {
      if (e.detail?.key === key) {
        try {
          const item = window.localStorage.getItem(key)
          if (item) {
            setStoredValue(JSON.parse(item))
          }
        } catch (error) {
          console.warn(`Error parsing localStorage update for "${key}":`, error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("localStorageUpdate", handleLocalStorageUpdate as EventListener)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("localStorageUpdate", handleLocalStorageUpdate as EventListener)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
          // Dispatch custom event for same-tab listeners
          window.dispatchEvent(
            new CustomEvent("localStorageUpdate", { detail: { key } })
          )
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

/**
 * Check if a localStorage value exists and was set within a certain time period
 *
 * @param key - The localStorage key
 * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
 * @returns boolean - Whether the value exists and is not expired
 */
export function useLocalStorageExpiry(
  key: string,
  maxAgeMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days
): [boolean, () => void] {
  const [dismissed, setDismissed] = useLocalStorage<{
    timestamp: number
  } | null>(key, null)

  const isExpired =
    !dismissed || Date.now() - dismissed.timestamp > maxAgeMs

  const markDismissed = useCallback(() => {
    setDismissed({ timestamp: Date.now() })
  }, [setDismissed])

  return [!isExpired, markDismissed]
}

export default useLocalStorage
