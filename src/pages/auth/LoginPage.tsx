import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Warehouse, ArrowRight, Lock, Mail, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      console.error("Login failed:", err)
      setError(err?.message || "Failed to sign in. Please verify your credentials.")
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail("manager@stocksense.io")
    setPassword("password123")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5A36] text-white shadow-xl shadow-[#FF5A36]/30 mb-2">
            <Warehouse className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Stock<span className="text-[#FF5A36]">Sense</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Real-time Modular Inventory Management System
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-white">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your email and password to access your warehouse dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300 text-xs">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="manager@stocksense.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#FF5A36]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300 text-xs">
                    Password
                  </Label>
                  <Link
                    to="/reset-password"
                    className="text-xs text-[#FF5A36] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#FF5A36]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white font-semibold shadow-lg shadow-[#FF5A36]/25 transition-all"
              >
                {submitting ? "Signing in..." : "Sign In to Dashboard"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500">Quick Test</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillDemoCredentials}
              className="w-full border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF5A36]" />
              Auto-fill Demo Credentials
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-800/80 py-4">
            <p className="text-xs text-zinc-400">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-[#FF5A36] hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
