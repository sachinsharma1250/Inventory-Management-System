import React from "react"
import { useAuth } from "@/context/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Shield, LogOut } from "lucide-react"

export const ProfilePage: React.FC = () => {
  const { user, role, isManager, logout } = useAuth()

  return (
    <div className="max-w-lg mx-auto pt-8 space-y-6">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="h-20 w-20 rounded-full bg-[#FF5A36]/20 border-2 border-[#FF5A36]/40 flex items-center justify-center text-3xl font-bold text-[#FF5A36]">
          {user?.displayName
            ? user.displayName.charAt(0).toUpperCase()
            : user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {user?.displayName || user?.email?.split("@")[0] || "User"}
          </h2>
          <p className="text-sm text-zinc-400">{user?.email || "user@stocksense.io"}</p>
        </div>
        <Badge
          className={
            isManager
              ? "bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/40 uppercase text-xs"
              : "bg-zinc-800 text-zinc-300 border-zinc-700 uppercase text-xs"
          }
        >
          {role}
        </Badge>
      </div>

      {/* Info rows */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 divide-y divide-zinc-800">
        <div className="flex items-center gap-3 px-5 py-4">
          <Mail className="h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Email</p>
            <p className="text-sm font-medium text-zinc-200">{user?.email || "user@stocksense.io"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <User className="h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Username</p>
            <p className="text-sm font-medium text-zinc-200">
              {user?.displayName || user?.email?.split("@")[0] || "User"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <Shield className="h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Role</p>
            <p className="text-sm font-medium text-zinc-200 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <Button
        variant="destructive"
        onClick={() => logout()}
        className="w-full gap-2 bg-red-950/50 hover:bg-red-900 border border-red-800/50 text-red-300"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}

export default ProfilePage
