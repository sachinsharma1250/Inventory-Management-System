import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Warehouse, ArrowRight, Lock, Mail, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const ResetPasswordPage: React.FC = () => {
  const [step, setStep] = useState<"request" | "verify">("request")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { sendPasswordResetOtp, confirmPasswordResetWithOtp, login } = useAuth()
  const navigate = useNavigate()

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await sendPasswordResetOtp(email)
      setSuccessMsg(`Verification code sent to ${email}. Check your inbox.`)
      setStep("verify")
    } catch (err: any) {
      console.error("Password reset request error:", err)
      setError(err?.message || "Failed to send reset code. Please check your email.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await confirmPasswordResetWithOtp(otpCode, newPassword)
      // Attempt auto-login with updated password and redirect to /dashboard
      try {
        await login(email, newPassword)
      } catch (loginErr) {
        console.warn("Auto login after reset skipped:", loginErr)
      }
      navigate("/dashboard", { replace: true })
    } catch (err: any) {
      console.error("OTP verification error:", err)
      setError(err?.message || "Invalid verification code or failed to reset password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5A36] text-white shadow-xl shadow-[#FF5A36]/30 mb-2">
            <Warehouse className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Stock<span className="text-[#FF5A36]">Sense</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Account Security & Password Recovery
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-white">
              {step === "request" ? "Reset Password" : "Enter Verification Code"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {step === "request"
                ? "Enter your email address to receive an OTP verification code"
                : "Enter the code received and choose your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {step === "request" ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-zinc-300 text-xs">
                    Account Email
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

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white font-semibold shadow-lg shadow-[#FF5A36]/25 transition-all"
                >
                  {submitting ? "Sending Code..." : "Send Verification OTP"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otpCode" className="text-zinc-300 text-xs">
                    6-Digit Verification Code (OTP)
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id="otpCode"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="pl-9 font-mono tracking-widest bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#FF5A36]"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    In development mode, enter default code <span className="font-mono text-zinc-300">123456</span>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-zinc-300 text-xs">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id="newPassword"
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#FF5A36]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white font-semibold shadow-lg shadow-[#FF5A36]/25 transition-all"
                >
                  {submitting ? "Verifying & Updating..." : "Verify & Go to Dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("request")}
                  className="w-full text-zinc-400 hover:text-white text-xs"
                >
                  Back to email request
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-800/80 py-4">
            <p className="text-xs text-zinc-400">
              Remembered your password?{" "}
              <Link to="/login" className="font-semibold text-[#FF5A36] hover:underline">
                Back to Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
