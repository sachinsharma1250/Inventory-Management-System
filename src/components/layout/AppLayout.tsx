import React, { useState } from "react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  Boxes,
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
  QrCode,
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
  const { user, logout } = useAuth()
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



  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-4 sm:px-6 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-zinc-300">
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

              </SheetContent>
            </Sheet>

            {/* Brand Logo in Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/20">
                <WarehouseIcon className="h-4.5 w-4.5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold tracking-tight text-white">
                  Stock<span className="text-[#FF5A36]">Sense</span>
                </span>
                <span className="block text-[9px] tracking-widest uppercase text-zinc-500">
                  Odoo IMS Matrix
                </span>
              </div>
              <Badge variant="outline" className="border-[#FF5A36]/40 bg-[#FF5A36]/10 text-[#FF5A36] text-[10px] hidden md:flex">
                v0.1
              </Badge>
            </div>

            {/* Horizontal Top Navigation Bar */}
            <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-zinc-800/80 pl-6">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#FF5A36]/15 text-[#FF5A36]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  )
                }
              >
                Dashboard
              </NavLink>

              {/* Operations Dropdown (Submenu: 1. Receipt, 2. Delivery, 3. Adjustment) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors outline-none",
                      location.pathname.startsWith("/receipts") ||
                        location.pathname.startsWith("/deliveries") ||
                        location.pathname.startsWith("/transfers") ||
                        location.pathname.startsWith("/adjustments")
                        ? "bg-[#FF5A36]/15 text-[#FF5A36]"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    )}
                  >
                    <span>Operations</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-zinc-950 border-zinc-800 text-zinc-200 w-48">
                  <DropdownMenuItem
                    onClick={() => navigate("/receipts")}
                    className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5 text-sky-400" />
                    <span>Receipt</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/deliveries")}
                    className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900"
                  >
                    <ArrowUpFromLine className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Delivery</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/adjustments/new")}
                    className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                    <span>Adjustment</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/transfers/new")}
                    className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Transfer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Stock / Products */}
              <NavLink
                to="/stock"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#FF5A36]/15 text-[#FF5A36]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  )
                }
              >
                Stock
              </NavLink>

              <NavLink
                to="/products"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#FF5A36]/15 text-[#FF5A36]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  )
                }
              >
                Products
              </NavLink>

              {/* Move History */}
              <NavLink
                to="/move-history"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#FF5A36]/15 text-[#FF5A36]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  )
                }
              >
                Move History
              </NavLink>

              {/* Settings Dropdown (Submenu: 1. Warehouse, 2. Locations) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors outline-none",
                      location.pathname.startsWith("/settings")
                        ? "bg-[#FF5A36]/15 text-[#FF5A36]"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    )}
                  >
                    <span>Settings</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-zinc-950 border-zinc-800 text-zinc-200 w-44">
                  <DropdownMenuItem
                    onClick={() => navigate("/settings/warehouses")}
                    className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900"
                  >
                    <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Warehouse</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings/locations")}
                    className="cursor-pointer text-xs gap-2 py-2 hover:bg-zinc-900 focus:bg-zinc-900"
                  >
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Locations</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/scan")}
              className="border-zinc-800 bg-zinc-900/60 hover:bg-[#FF5A36]/10 hover:border-[#FF5A36]/50 text-xs gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5 text-[#FF5A36]" />
              <span className="hidden sm:inline">Quick Scan</span>
            </Button>

            {/* User Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-zinc-900 border border-zinc-800 bg-zinc-900/60 transition-colors">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF5A36]/20 text-[#FF5A36] font-bold text-xs border border-[#FF5A36]/30">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:block text-xs font-medium text-zinc-200 max-w-[100px] truncate">
                    {user?.displayName || user?.email?.split("@")[0] || "User"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-zinc-950 border-zinc-800 text-zinc-200">
                <DropdownMenuLabel>
                  <span className="block text-xs font-semibold text-zinc-100">
                    {user?.displayName || user?.email?.split("@")[0] || "User"}
                  </span>
                  <span className="block text-[10px] text-zinc-500 font-normal truncate">{user?.email || "user@stocksense.io"}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-xs hover:bg-zinc-900 focus:bg-zinc-900"
                  onClick={() => navigate("/profile")}
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-xs text-red-400 focus:text-red-300 hover:bg-red-950/30 focus:bg-red-950/30"
                  onClick={handleLogout}
                  id="logout-btn"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 overflow-y-auto bg-black p-4 md:p-8">
          <Outlet />
        </main>
    </div>
  )
}
