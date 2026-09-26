import React from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-[#FF5A36]/20 border-t-[#FF5A36] animate-spin" />
          <div className="absolute h-4 w-4 rounded-full bg-[#FF5A36] animate-ping opacity-75" />
        </div>
        <p className="mt-4 text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Authenticating StockSense...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
