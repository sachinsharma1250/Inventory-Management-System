import React, { useState } from "react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  Boxes,
  QrCode,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Building2,
  MapPin,
  User,
  LogOut,
  Menu,
  ChevronDown,
  Warehouse as WarehouseIcon,
  ShieldAlert,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Catalog",
    items: [
      { title: "Products", href: "/products", icon: Package },
      { title: "Stock Levels", href: "/stock", icon: Boxes },
      { title: "Barcode Scanner", href: "/scan", icon: QrCode },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Receipts (Incoming)", href: "/receipts", icon: ArrowDownToLine },
      { title: "Deliveries (Outgoing)", href: "/deliveries", icon: ArrowUpFromLine },
      { title: "Internal Transfers", href: "/transfers/new", icon: ArrowLeftRight },
      { title: "Stock Adjustments", href: "/adjustments/new", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Audit & Ledger",
    items: [
      { title: "Move History", href: "/move-history", icon: History },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Warehouses", href: "/settings/warehouses", icon: Building2 },
      { title: "Locations", href: "/settings/locations", icon: MapPin },
    ],
  },
]

export const AppLayout: React.FC = () => {
  const { user, logout, isMockAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const renderNavLinks = (onItemClick?: () => void) => (
    <div className="flex-1 space-y-6 px-3 py-4">
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-zinc-500">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.href)

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#FF5A36]/15 text-[#FF5A36] font-semibold border-l-2 border-[#FF5A36]"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-[#FF5A36]" : "text-zinc-400 group-hover:text-zinc-200"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-zinc-700">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  const renderUserProfile = () => (
    <div className="border-t border-zinc-800/80 p-3 bg-zinc-950/60">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF5A36]/20 text-[#FF5A36] font-bold text-sm border border-[#FF5A36]/30">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-zinc-200">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </p>
                <p className="truncate text-[10px] text-zinc-500">{user?.email || "user@stocksense.io"}</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200">
          <DropdownMenuLabel>
            <span className="block text-xs font-semibold text-zinc-100">My Account</span>
            <span className="block text-[10px] text-zinc-500 font-normal truncate">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            className="cursor-pointer gap-2 hover:bg-zinc-900 focus:bg-zinc-900"
            onClick={() => navigate("/profile")}
          >
            <User className="h-4 w-4 text-zinc-400" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-red-400 focus:text-red-300 hover:bg-red-950/30 focus:bg-red-950/30"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mt-2 flex items-center justify-between px-1">
        <NavLink
          to="/profile"
          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <User className="h-3 w-3" />
          <span>Profile</span>
        </NavLink>
        <button
          onClick={handleLogout}
          id="logout-btn"
          className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      {/* Desktop Left-Nav Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-zinc-800/80 bg-zinc-950/95 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30">
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                Stock<span className="text-[#FF5A36]">Sense</span>
              </span>
              <span className="block text-[10px] tracking-widest uppercase text-zinc-500">
                Odoo IMS Matrix
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-[#FF5A36]/40 bg-[#FF5A36]/10 text-[#FF5A36] text-[10px]">
            v0.1
          </Badge>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderNavLinks()}
        </div>

        {/* Bottom Profile and Logout Section */}
        {renderUserProfile()}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-4 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-zinc-300">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-zinc-950 border-r border-zinc-800 flex flex-col">
                <SheetHeader className="p-4 border-b border-zinc-800 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A36] text-white">
                      <WarehouseIcon className="h-4 w-4" />
                    </div>
                    <SheetTitle className="text-base font-bold text-white">
                      Stock<span className="text-[#FF5A36]">Sense</span>
                    </SheetTitle>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  {renderNavLinks(() => setMobileOpen(false))}
                </div>
                {renderUserProfile()}
              </SheetContent>
            </Sheet>

            {/* Current route indicator */}
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="text-zinc-600 font-mono">/</span>
              <span className="font-medium text-zinc-200 capitalize">
                {location.pathname.replace(/^\//, "").split("/")[0] || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMockAuth && (
              <Badge variant="outline" className="border-amber-700/50 bg-amber-950/30 text-amber-400 text-xs hidden sm:flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                Dev Mode
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/scan")}
              className="border-zinc-800 bg-zinc-900/60 hover:bg-[#FF5A36]/10 hover:border-[#FF5A36]/50 text-xs gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5 text-[#FF5A36]" />
              <span className="hidden sm:inline">Quick Scan</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/transfers/new")}
              className="bg-[#FF5A36] hover:bg-[#FF5A36]/90 text-white text-xs gap-1 shadow-md shadow-[#FF5A36]/20 font-medium"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span className="hidden md:inline">New Transfer</span>
            </Button>
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 overflow-y-auto bg-black p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
