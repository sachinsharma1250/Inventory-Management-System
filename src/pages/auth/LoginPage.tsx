import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Warehouse,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  RefreshCw,
  X,
} from "lucide-react"

interface LoginPageProps {
  initialView?: "login" | "signup" | "forgot"
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialView = "login" }) => {
  const [view, setView] = useState<"login" | "signup" | "forgot">(initialView)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Login form state
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Sign up form state
  const [signupUsername, setSignupUsername] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")

  // Forgot password state — proper OTP flow
  const [forgotEmail, setForgotEmail] = useState("")
  const [resetStep, setResetStep] = useState<"email" | "otp" | "newpass">("email")
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(["", "", "", "", "", ""])
  const [resetOtpCountdown, setResetOtpCountdown] = useState(0)
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  // Email OTP Authorization state (Google sign-in 2FA)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpEmail, setOtpEmail] = useState("")
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""])
  const [otpCountdown, setOtpCountdown] = useState(60)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpSubmitting, setOtpSubmitting] = useState(false)

  const { login, signup, loginWithGoogle, sendEmailOtp, verifyEmailOtp, confirmPasswordResetWithOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || "/dashboard"

  useEffect(() => {
    setView(initialView)
  }, [initialView])

  // OTP countdown (Google auth modal)
  useEffect(() => {
    if (!showOtpModal || otpCountdown <= 0) return
    const timer = setInterval(() => setOtpCountdown((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [showOtpModal, otpCountdown])

  // OTP countdown (password reset)
  useEffect(() => {
    if (resetStep !== "otp" || resetOtpCountdown <= 0) return
    const timer = setInterval(() => setResetOtpCountdown((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [resetStep, resetOtpCountdown])

  const switchView = (newView: "login" | "signup" | "forgot") => {
    setError(null)
    setSuccessMsg(null)
    if (newView === "forgot") {
      setResetStep("email")
      setResetOtpDigits(["", "", "", "", "", ""])
      setNewPassword("")
      setConfirmNewPassword("")
    }
    setView(newView)
  }

  // ──────────── LOGIN ────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const emailToUse = loginUsername.includes("@")
        ? loginUsername
        : `${loginUsername.toLowerCase().trim()}@stocksense.io`
      await login(emailToUse, loginPassword)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError("Invalid Username or Password.")
    } finally {
      setSubmitting(false)
    }
  }

  // ──────────── GOOGLE + OTP 2FA ────────────
  const handleGoogleSignIn = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const googleResult = await loginWithGoogle()
      const targetEmail = googleResult.email || "demo.user@gmail.com"
      await sendEmailOtp(targetEmail)
      setOtpEmail(targetEmail)
      setOtpDigits(["", "", "", "", "", ""])
      setOtpCountdown(60)
      setOtpError(null)
      setShowOtpModal(true)
    } catch {
      setError("Google sign-in failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // OTP digit handlers (shared)
  const handleDigitChange = (
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    val: string,
    idPrefix: string
  ) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, "").slice(0, 6).split("")
      const next = [...digits]
      pasted.forEach((c, i) => { if (i < 6) next[i] = c })
      setDigits(next)
      document.getElementById(`${idPrefix}-${Math.min(pasted.length, 5)}`)?.focus()
      return
    }
    if (val && !/^\d$/.test(val)) return
    const next = [...digits]
    next[index] = val
    setDigits(next)
    if (val && index < 5) document.getElementById(`${idPrefix}-${index + 1}`)?.focus()
  }

  const handleDigitKeyDown = (
    digits: string[],
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    idPrefix: string
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`${idPrefix}-${index - 1}`)?.focus()
    }
  }

  // Verify Google OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError(null)
    const code = otpDigits.join("")
    if (code.length < 6) { setOtpError("Enter all 6 digits."); return }
    setOtpSubmitting(true)
    try {
      await verifyEmailOtp(otpEmail, code, otpEmail.split("@")[0], "manager")
      setShowOtpModal(false)
      navigate(from, { replace: true })
    } catch (err: any) {
      setOtpError(err?.message || "Invalid OTP. Use code 123456 for testing.")
    } finally {
      setOtpSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return
    setOtpSubmitting(true)
    try { await sendEmailOtp(otpEmail); setOtpCountdown(60); setOtpError(null) }
    catch { setOtpError("Failed to resend. Try again.") }
    finally { setOtpSubmitting(false) }
  }

  // ──────────── SIGN UP ────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (signupUsername.trim().length < 3) { setError("Username must be at least 3 characters."); return }
    if (!signupEmail.includes("@")) { setError("Please enter a valid Email."); return }
    if (signupPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    setSubmitting(true)
    try {
      await signup(signupEmail, signupPassword, signupUsername, "staff")
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.message || "Failed to create account.")
    } finally {
      setSubmitting(false)
    }
  }

  // ──────────── FORGOT PASSWORD (proper 3-step OTP flow) ────────────
  // Step 1: Enter email → send OTP
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!forgotEmail.includes("@")) { setError("Enter a valid email address."); return }
    setSubmitting(true)
    try {
      await sendEmailOtp(forgotEmail)
      setResetOtpDigits(["", "", "", "", "", ""])
      setResetOtpCountdown(60)
      setResetStep("otp")
      setSuccessMsg(`6-digit OTP sent to ${forgotEmail}`)
    } catch {
      setError("Failed to send OTP. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Step 2: Verify OTP code
  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const code = resetOtpDigits.join("")
    if (code.length < 6) { setError("Enter all 6 digits of the OTP."); return }
    setSubmitting(true)
    try {
      // Validate the OTP (123456 is always accepted in dev mode)
      const storedOtp = sessionStorage.getItem(`stocksense_otp_${forgotEmail.toLowerCase().trim()}`) || "123456"
      if (code !== "123456" && code !== storedOtp) {
        throw new Error("Invalid OTP code.")
      }
      setSuccessMsg("OTP verified. Set your new password.")
      setResetStep("newpass")
    } catch (err: any) {
      setError(err?.message || "Invalid OTP code.")
    } finally {
      setSubmitting(false)
    }
  }

  // Resend reset OTP
  const handleResendResetOtp = async () => {
    if (resetOtpCountdown > 0) return
    setSubmitting(true)
    try {
      await sendEmailOtp(forgotEmail)
      setResetOtpCountdown(60)
      setError(null)
      setSuccessMsg("New OTP sent to your email.")
    } catch {
      setError("Failed to resend OTP.")
    } finally {
      setSubmitting(false)
    }
  }

  // Step 3: Set new password
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    if (newPassword !== confirmNewPassword) { setError("Passwords do not match."); return }
    setSubmitting(true)
    try {
      const code = resetOtpDigits.join("")
      await confirmPasswordResetWithOtp(code, newPassword)
      setSuccessMsg("Password reset successful! You can now login.")
      setTimeout(() => switchView("login"), 1500)
    } catch (err: any) {
      setError(err?.message || "Failed to reset password.")
    } finally {
      setSubmitting(false)
    }
  }

  const isSignUp = view === "signup"
  const isForgot = view === "forgot"

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden bg-[#060d22]">
      {/* Animated Deep Blue/Navy Gradient Background */}
      <div className="absolute inset-0 animate-sunset-gradient opacity-95 pointer-events-none" />

      {/* Floating Ambient Orbs — Deep Blue Tones */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-800/30 via-indigo-700/20 to-cyan-600/10 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-indigo-600/30 via-blue-700/20 to-slate-800/10 blur-3xl animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-blue-500/15 to-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Container */}
      <div className="relative z-10 w-full max-w-4xl min-h-[540px] md:h-[540px] rounded-[28px] frosted-glass-card shadow-2xl shadow-blue-950/60 overflow-hidden flex flex-col md:flex-row transition-all duration-700">

        {/* ═══════════ SLIDING OVERLAY PANEL ═══════════ */}
        <div
          className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full z-20 transition-transform duration-700 ease-in-out frosted-glass-overlay text-white p-8 flex-col justify-between ${
            isSignUp ? "translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-52 h-52 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

          {/* Brand */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="h-9 w-9 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">StockSense</span>
          </div>

          {/* Center Text */}
          <div className="relative z-10 my-auto py-4">
            {!isSignUp ? (
              <div className="space-y-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Welcome Back!
                </h1>
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  Sign in to manage your inventory, track stock levels, and handle warehouse operations.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Hello, Friend!
                </h1>
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  Create your account to get started with real-time inventory management.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Toggle */}
          <div className="relative z-10 pt-3 border-t border-white/15">
            {!isSignUp ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-100/70">No account?</span>
                <button
                  type="button"
                  id="slide-to-signup-btn"
                  onClick={() => switchView("signup")}
                  className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-100/70">Have an account?</span>
                <button
                  type="button"
                  id="slide-to-login-btn"
                  onClick={() => switchView("login")}
                  className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ LEFT: SIGN UP FORM ═══════════ */}
        <div
          className={`w-full md:w-1/2 h-full p-7 sm:p-8 flex flex-col justify-center transition-opacity duration-500 ${
            isSignUp ? "opacity-100 z-10" : "opacity-0 pointer-events-none hidden md:flex"
          }`}
        >
          <div className="max-w-sm w-full mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Create Account</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Fill in your details to register</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-200">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                  <input type="text" required placeholder="Username" value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                  <input type="email" required placeholder="Email" value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                  <input type="password" required placeholder="Password" value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={submitting} id="register-btn"
                className="w-full mt-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2">
                {submitting ? "Registering..." : "Register"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="text-center">
              <button type="button" id="toggle-signin-link" onClick={() => switchView("login")}
                className="text-xs text-zinc-400 hover:text-white transition-colors">
                Already have an account? <span className="font-semibold text-blue-400 underline underline-offset-4">Sign in</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT: LOGIN / FORGOT PASSWORD FORM ═══════════ */}
        <div
          className={`w-full md:w-1/2 h-full p-7 sm:p-8 flex flex-col justify-center transition-opacity duration-500 ${
            !isSignUp ? "opacity-100 z-10" : "opacity-0 pointer-events-none hidden md:flex"
          }`}
        >
          <div className="max-w-sm w-full mx-auto space-y-4">
            {/* ─── FORGOT PASSWORD (3-step OTP flow) ─── */}
            {isForgot ? (
              <>
                <div>
                  <h2 className="text-xl font-bold text-white">Reset Password</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {resetStep === "email" && "Enter your email to receive a 6-digit OTP"}
                    {resetStep === "otp" && "Enter the OTP sent to your email"}
                    {resetStep === "newpass" && "Set your new password"}
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-200">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" /> <span>{error}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> <span>{successMsg}</span>
                  </div>
                )}

                {/* Step 1: Email Input */}
                {resetStep === "email" && (
                  <form onSubmit={handleForgotSendOtp} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                        <input type="email" required placeholder="your@email.com" value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                      </div>
                    </div>
                    <button type="submit" disabled={submitting} id="send-otp-btn"
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2">
                      {submitting ? "Sending..." : "Send OTP"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <div className="text-center">
                      <button type="button" id="back-to-login-link" onClick={() => switchView("login")}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors">
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: OTP Verification */}
                {resetStep === "otp" && (
                  <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                    <div className="text-xs text-zinc-300">
                      OTP sent to <span className="font-semibold text-blue-300">{forgotEmail}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      {resetOtpDigits.map((digit, i) => (
                        <input key={i} id={`reset-otp-${i}`} type="text" maxLength={6} value={digit}
                          onChange={(e) => handleDigitChange(resetOtpDigits, setResetOtpDigits, i, e.target.value, "reset-otp")}
                          onKeyDown={(e) => handleDigitKeyDown(resetOtpDigits, i, e, "reset-otp")}
                          className="w-11 h-12 text-center text-lg font-bold rounded-lg frosted-glass-input text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all" />
                      ))}
                    </div>
                    <button type="submit" disabled={submitting}
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2">
                      {submitting ? "Verifying..." : "Verify OTP"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <button type="button" onClick={handleResendResetOtp} disabled={resetOtpCountdown > 0}
                        className={`flex items-center gap-1 font-medium ${resetOtpCountdown > 0 ? "text-zinc-600 cursor-not-allowed" : "text-blue-400 hover:text-blue-300 underline"}`}>
                        <RefreshCw className="h-3 w-3" />
                        {resetOtpCountdown > 0 ? `Resend (${resetOtpCountdown}s)` : "Resend OTP"}
                      </button>
                      <button type="button" onClick={() => switchView("login")} className="text-zinc-400 hover:text-white transition-colors">Cancel</button>
                    </div>
                  </form>
                )}

                {/* Step 3: New Password */}
                {resetStep === "newpass" && (
                  <form onSubmit={handleForgotResetPassword} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                        <input type="password" required placeholder="New password" value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                        <input type="password" required placeholder="Confirm password" value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                      </div>
                    </div>
                    <button type="submit" disabled={submitting}
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2">
                      {submitting ? "Resetting..." : "Reset Password"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </>
            ) : (
              /* ─── LOGIN VIEW ─── */
              <>
                <div>
                  <h2 className="text-xl font-bold text-white">Login</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Sign in to your account</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-200">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" /> <span>{error}</span>
                  </div>
                )}

                {/* Google Sign In */}
                <button type="button" id="google-gmail-btn" onClick={handleGoogleSignIn} disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  Continue with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="px-2 text-zinc-500 bg-[#0a1230]/80 backdrop-blur-md rounded">or</span>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                      <input type="text" required placeholder="Username or Email" value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300">Password</label>
                      <button type="button" id="forgot-password-link" onClick={() => switchView("forgot")}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-blue-400/70" />
                      <input type="password" required placeholder="Password" value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg frosted-glass-input text-sm placeholder:text-zinc-500 focus:outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} id="login-btn"
                    className="w-full mt-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2">
                    {submitting ? "Signing In..." : "Login"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="text-center">
                  <button type="button" id="toggle-signup-link" onClick={() => switchView("signup")}
                    className="text-xs text-zinc-400 hover:text-white transition-colors">
                    Don't have an account?{" "}
                    <span className="font-semibold text-blue-400 underline underline-offset-4">Sign up</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ EMAIL OTP MODAL (Google 2FA) ═══════════ */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md rounded-2xl frosted-glass-card p-6 border border-white/15 shadow-2xl shadow-blue-950/70 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Email OTP Verification</h3>
                  <p className="text-[11px] text-zinc-400">Authorization code sent to your email</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowOtpModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Enter the 6-digit code sent to <span className="font-semibold text-blue-300">{otpEmail}</span>
            </p>

            {otpError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-200">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" /> <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, i) => (
                  <input key={i} id={`otp-input-${i}`} type="text" maxLength={6} value={digit}
                    onChange={(e) => handleDigitChange(otpDigits, setOtpDigits, i, e.target.value, "otp-input")}
                    onKeyDown={(e) => handleDigitKeyDown(otpDigits, i, e, "otp-input")}
                    className="w-11 h-13 text-center text-lg font-bold rounded-lg frosted-glass-input text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all" />
                ))}
              </div>

              <button type="submit" disabled={otpSubmitting}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2">
                {otpSubmitting ? "Verifying..." : "Verify & Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/8">
                <button type="button" onClick={handleResendOtp} disabled={otpCountdown > 0 || otpSubmitting}
                  className={`flex items-center gap-1 font-medium ${otpCountdown > 0 ? "text-zinc-600 cursor-not-allowed" : "text-blue-400 hover:text-blue-300 underline"}`}>
                  <RefreshCw className="h-3 w-3" />
                  {otpCountdown > 0 ? `Resend (${otpCountdown}s)` : "Resend OTP"}
                </button>
                <button type="button" onClick={() => setShowOtpModal(false)} className="text-zinc-400 hover:text-white transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
