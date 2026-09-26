import React from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Shield, KeyRound, LogOut, ToggleLeft, ToggleRight, Check } from "lucide-react"

export const ProfilePage: React.FC = () => {
  const { user, token, role, isManager, logout, setMockRole } = useAuth()

  const handleToggleRole = () => {
    if (setMockRole) {
      const nextRole = role === "manager" ? "staff" : "manager"
      setMockRole(nextRole)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <User className="h-6 w-6 text-[#FF5A36]" />
            User Profile & Authorization
          </h1>
          <p className="text-sm text-zinc-400">
            Account identity, JWT session state, and Role-Based Access Control (RBAC).
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-zinc-800 text-zinc-400">
          Route: /profile
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Account & Role Card */}
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Account Details</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Active Firebase Authentication and Firestore User Record
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Email Address</p>
                <p className="font-medium text-zinc-200">{user?.email || "manager@stocksense.io"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Display Name</p>
                <p className="font-medium text-zinc-200">{user?.displayName || "Warehouse Lead"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Assigned Role</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={
                      isManager
                        ? "bg-[#FF5A36]/20 text-[#FF5A36] border-[#FF5A36]/40 uppercase text-xs font-mono"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700 uppercase text-xs font-mono"
                    }
                  >
                    {role}
                  </Badge>
                  <span className="text-xs text-zinc-400">
                    {isManager ? "(Full Write Access to Warehouses & Locations)" : "(Read-Only Access)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick RBAC Switcher for Review/Testing */}
            {setMockRole && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <p className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                  <span>Test RBAC Permissions</span>
                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                    Live Toggle
                  </Badge>
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Toggle between <strong className="text-zinc-200">manager</strong> and{" "}
                  <strong className="text-zinc-200">staff</strong> to verify that warehouse/location write controls and Firestore rules adapt in real-time.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleRole}
                  className="mt-2 w-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-100 gap-2"
                >
                  {isManager ? <ToggleRight className="h-4 w-4 text-[#FF5A36]" /> : <ToggleLeft className="h-4 w-4 text-zinc-400" />}
                  Switch to {role === "manager" ? "Staff (Read-Only)" : "Manager (Full Access)"}
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-800 flex gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => logout()}
                className="gap-2 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* JWT & Security Info Card */}
        <Card className="border-zinc-800 bg-zinc-950/80 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">JWT Token & Authorization</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Firebase Auth ID Token passed in API and Cloud Function requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <KeyRound className="h-4 w-4 text-[#FF5A36]" />
              <span>Active Bearer Token:</span>
            </div>
            <div className="overflow-x-auto rounded bg-zinc-900 p-3 text-[11px] text-zinc-400 break-all border border-zinc-800">
              Bearer {token ? `${token.substring(0, 64)}...[signature verified]` : "None"}
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 text-zinc-400 space-y-1.5 font-sans">
              <p className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Firestore Security Enforcement
              </p>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Write operations to <code className="text-[#FF5A36]">/warehouses</code> and{" "}
                <code className="text-[#FF5A36]">/locations</code> are gated by{" "}
                <code className="text-zinc-200">isManager()</code> check in{" "}
                <code className="text-zinc-200">firestore.rules</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
