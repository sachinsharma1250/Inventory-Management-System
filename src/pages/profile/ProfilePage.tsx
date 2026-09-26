import React from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Shield, KeyRound, LogOut } from "lucide-react"

// TODO: [Team Member 1] Implement User Profile & Role Settings
// - Display current Firebase user UID, email, displayName, and role (manager vs staff)
// - Display current JWT ID token info / expiration
// - Change password or update display name

export const ProfilePage: React.FC = () => {
  const { user, token, logout, isMockAuth } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <User className="h-6 w-6 text-[#FF5A36]" />
            User Profile
          </h1>
          <p className="text-sm text-zinc-400">
            Account identity, JWT authorization session, and warehouse access credentials.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-zinc-800 text-zinc-400">
          Route: /profile
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-base text-zinc-200">Account Details</CardTitle>
            <CardDescription className="text-zinc-500">
              Active Firebase session information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500">Email Address</p>
                <p className="font-medium text-zinc-200">{user?.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500">Display Name</p>
                <p className="font-medium text-zinc-200">{user?.displayName || "Warehouse Operator"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500">Role & Environment</p>
                <div className="flex gap-2 mt-1">
                  <Badge className="bg-[#FF5A36]/20 text-[#FF5A36] border-[#FF5A36]/40">
                    Inventory Manager
                  </Badge>
                  {isMockAuth && (
                    <Badge variant="secondary" className="text-[10px]">
                      Dev Fallback
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => logout()}
                className="gap-2 bg-red-900/60 hover:bg-red-800 text-red-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-zinc-800 bg-zinc-950/40">
          <CardHeader>
            <CardTitle className="text-base text-zinc-200">JWT Token & Authorization</CardTitle>
            <CardDescription className="text-zinc-500 font-mono text-xs">
              Assigned Track: Member 1 (Auth & Profile)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <KeyRound className="h-4 w-4 text-[#FF5A36]" />
              <span>JWT Authorization Header:</span>
            </div>
            <div className="overflow-x-auto rounded bg-zinc-900/80 p-3 text-[11px] text-zinc-400 break-all border border-zinc-800">
              Bearer {token ? `${token.substring(0, 48)}...[truncated]` : "No active JWT token"}
            </div>
            <p className="text-zinc-500 pt-2">
              // TODO: Implement password change dialog and multi-factor profile settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default ProfilePage
