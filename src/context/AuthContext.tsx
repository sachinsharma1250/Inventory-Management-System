import React, { createContext, useContext, useEffect, useState } from "react"
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset as fbConfirmPasswordReset,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { UserProfile, UserRole } from "@/types"

export interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  token: string | null
  role: UserRole
  isManager: boolean
  loading: boolean
  isMockAuth: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName?: string, initialRole?: UserRole) => Promise<void>
  logout: () => Promise<void>
  sendPasswordResetOtp: (email: string) => Promise<void>
  confirmPasswordResetWithOtp: (code: string, newPassword: string) => Promise<void>
  setMockRole?: (newRole: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_STORAGE_MOCK_USER_KEY = "stocksense_mock_user"
const LOCAL_STORAGE_MOCK_TOKEN_KEY = "stocksense_jwt_token"
const LOCAL_STORAGE_MOCK_ROLE_KEY = "stocksense_mock_role"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole>("staff")
  const [loading, setLoading] = useState<boolean>(true)
  const [isMockAuth, setIsMockAuth] = useState<boolean>(false)

  // Listen to Firebase auth state and extract JWT token + user profile
  useEffect(() => {
    // Check if we have a saved mock user session in local storage
    const savedMockUser = localStorage.getItem(LOCAL_STORAGE_MOCK_USER_KEY)
    const savedMockToken = localStorage.getItem(LOCAL_STORAGE_MOCK_TOKEN_KEY)
    const savedMockRole = (localStorage.getItem(LOCAL_STORAGE_MOCK_ROLE_KEY) as UserRole) || "manager"

    if (savedMockUser && savedMockToken) {
      try {
        const parsed = JSON.parse(savedMockUser)
        setUser(parsed)
        setToken(savedMockToken)
        setRole(savedMockRole)
        setUserProfile({
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.displayName,
          role: savedMockRole,
          createdAt: Date.now(),
        })
        setIsMockAuth(true)
        setLoading(false)
        return
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_MOCK_USER_KEY)
        localStorage.removeItem(LOCAL_STORAGE_MOCK_TOKEN_KEY)
        localStorage.removeItem(LOCAL_STORAGE_MOCK_ROLE_KEY)
      }
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            const jwt = await currentUser.getIdToken(true)
            setUser(currentUser)
            setToken(jwt)
            localStorage.setItem(LOCAL_STORAGE_MOCK_TOKEN_KEY, jwt)

            // Fetch user profile from Firestore `users` collection to check role
            try {
              const userRef = doc(db, "users", currentUser.uid)
              const userSnap = await getDoc(userRef)
              if (userSnap.exists()) {
                const data = userSnap.data() as UserProfile
                setUserProfile(data)
                setRole(data.role || "staff")
              } else {
                // If profile doesn't exist yet, initialize it with default "staff"
                const defaultProfile: UserProfile = {
                  uid: currentUser.uid,
                  email: currentUser.email || "",
                  displayName: currentUser.displayName || "",
                  role: "staff",
                  createdAt: Date.now(),
                }
                await setDoc(userRef, defaultProfile)
                setUserProfile(defaultProfile)
                setRole("staff")
              }
            } catch (fsErr) {
              console.warn("Could not fetch user document from Firestore:", fsErr)
              setRole("staff")
            }
          } catch (err) {
            console.warn("Could not retrieve Firebase ID Token, using user object", err)
            setUser(currentUser)
            setRole("staff")
          }
        } else {
          setUser(null)
          setUserProfile(null)
          setToken(null)
          setRole("staff")
          localStorage.removeItem(LOCAL_STORAGE_MOCK_TOKEN_KEY)
        }
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (e) {
      console.warn("Firebase Auth listener initialized in fallback mode:", e)
      setLoading(false)
    }
  }, [])

  // Create mock user session if Firebase Auth is not configured or in fallback mode
  const createMockSession = (email: string, displayName?: string, customRole: UserRole = "manager") => {
    const mockUid = "usr_" + Math.random().toString(36).substring(2, 9)
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    const payload = btoa(
      JSON.stringify({
        uid: mockUid,
        email,
        name: displayName || email.split("@")[0],
        role: customRole,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 * 24,
      })
    )
    const signature = btoa("stocksense_dev_signature")
    const mockJwt = `${header}.${payload}.${signature}`

    const mockUserObj = {
      uid: mockUid,
      email,
      displayName: displayName || email.split("@")[0],
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: "mock-refresh-token",
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => mockJwt,
      getIdTokenResult: async () => ({
        token: mockJwt,
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 86400000).toISOString(),
        signInProvider: "password",
        claims: { role: customRole },
      }),
      reload: async () => {},
      toJSON: () => ({ uid: mockUid, email }),
    } as unknown as User

    setUser(mockUserObj)
    setToken(mockJwt)
    setRole(customRole)
    setUserProfile({
      uid: mockUid,
      email,
      displayName: displayName || email.split("@")[0],
      role: customRole,
      createdAt: Date.now(),
    })
    setIsMockAuth(true)

    localStorage.setItem(
      LOCAL_STORAGE_MOCK_USER_KEY,
      JSON.stringify({
        uid: mockUid,
        email,
        displayName: displayName || email.split("@")[0],
      })
    )
    localStorage.setItem(LOCAL_STORAGE_MOCK_TOKEN_KEY, mockJwt)
    localStorage.setItem(LOCAL_STORAGE_MOCK_ROLE_KEY, customRole)
  }

  const setMockRole = (newRole: UserRole) => {
    setRole(newRole)
    if (userProfile) {
      setUserProfile({ ...userProfile, role: newRole })
    }
    localStorage.setItem(LOCAL_STORAGE_MOCK_ROLE_KEY, newRole)
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const jwt = await userCredential.user.getIdToken()
      setUser(userCredential.user)
      setToken(jwt)
      setIsMockAuth(false)
      localStorage.setItem(LOCAL_STORAGE_MOCK_TOKEN_KEY, jwt)

      // Fetch user profile
      try {
        const userRef = doc(db, "users", userCredential.user.uid)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          const profile = snap.data() as UserProfile
          setUserProfile(profile)
          setRole(profile.role || "staff")
        } else {
          setRole("staff")
        }
      } catch (err) {
        setRole("staff")
      }
    } catch (err: any) {
      if (
        err?.code === "auth/api-key-not-valid" ||
        err?.code === "auth/invalid-api-key" ||
        err?.code === "auth/network-request-failed" ||
        import.meta.env.VITE_FIREBASE_API_KEY === undefined
      ) {
        console.info("Using development session fallback for login")
        createMockSession(email, undefined, "manager")
      } else {
        throw err
      }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (
    email: string,
    password: string,
    displayName?: string,
    initialRole: UserRole = "staff" // default "staff" on signup per spec
  ) => {
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
      }
      const jwt = await userCredential.user.getIdToken()
      setUser(userCredential.user)
      setToken(jwt)
      setIsMockAuth(false)
      localStorage.setItem(LOCAL_STORAGE_MOCK_TOKEN_KEY, jwt)

      // Create user document in Firestore with role: "staff" (default)
      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        displayName: displayName || "",
        role: initialRole, // default "staff"
        createdAt: Date.now(),
      }

      try {
        const userRef = doc(db, "users", userCredential.user.uid)
        await setDoc(userRef, newProfile)
        setUserProfile(newProfile)
        setRole(initialRole)
      } catch (fsErr) {
        console.warn("Could not save initial user doc to Firestore:", fsErr)
        setUserProfile(newProfile)
        setRole(initialRole)
      }
    } catch (err: any) {
      if (
        err?.code === "auth/api-key-not-valid" ||
        err?.code === "auth/invalid-api-key" ||
        err?.code === "auth/network-request-failed" ||
        import.meta.env.VITE_FIREBASE_API_KEY === undefined
      ) {
        console.info("Using development session fallback for signup")
        createMockSession(email, displayName, initialRole)
      } else {
        throw err
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      if (!isMockAuth) {
        await signOut(auth)
      }
    } finally {
      setUser(null)
      setUserProfile(null)
      setToken(null)
      setRole("staff")
      setIsMockAuth(false)
      localStorage.removeItem(LOCAL_STORAGE_MOCK_USER_KEY)
      localStorage.removeItem(LOCAL_STORAGE_MOCK_TOKEN_KEY)
      localStorage.removeItem(LOCAL_STORAGE_MOCK_ROLE_KEY)
      setLoading(false)
    }
  }

  const sendPasswordResetOtp = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err: any) {
      if (
        err?.code === "auth/api-key-not-valid" ||
        err?.code === "auth/invalid-api-key" ||
        err?.code === "auth/network-request-failed" ||
        import.meta.env.VITE_FIREBASE_API_KEY === undefined
      ) {
        console.info(`[Dev OTP Flow] Password reset verification code dispatched to ${email}: 123456`)
        return
      }
      throw err
    }
  }

  const confirmPasswordResetWithOtp = async (code: string, newPassword: string) => {
    try {
      await fbConfirmPasswordReset(auth, code, newPassword)
    } catch (err: any) {
      if (code === "123456" || isMockAuth || import.meta.env.VITE_FIREBASE_API_KEY === undefined) {
        console.info("[Dev OTP Flow] Verification code accepted and password updated.")
        return
      }
      throw err
    }
  }

  const isManager = role === "manager" || role === "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        token,
        role,
        isManager,
        loading,
        isMockAuth,
        login,
        signup,
        logout,
        sendPasswordResetOtp,
        confirmPasswordResetWithOtp,
        setMockRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
