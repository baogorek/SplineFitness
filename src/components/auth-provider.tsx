"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase"

type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(firebaseAuth))

  useEffect(() => {
    if (!firebaseAuth) return

    return onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
      },
      (error) => {
        console.error("Authentication state error:", error)
        setUser(null)
        setLoading(false)
      }
    )
  }, [])

  const signInWithGoogle = async () => {
    if (!firebaseAuth) {
      console.error("Firebase is not configured")
      return
    }

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    await signInWithPopup(firebaseAuth, provider)
  }

  const signOut = async () => {
    if (!firebaseAuth) return

    try {
      await firebaseSignOut(firebaseAuth)
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
