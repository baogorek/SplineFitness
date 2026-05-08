"use client"

import { useState, useCallback } from "react"

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error)
    return initialValue
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => readStoredValue(key, initialValue))
  const isLoaded = true

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error)
        }
        return valueToStore
      })
    },
    [key]
  )

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return { value: storedValue, setValue, removeValue, isLoaded }
}
