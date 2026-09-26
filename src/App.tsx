import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage"
import { SignupPage } from "@/pages/auth/SignupPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

// Core Feature Stubs
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { ProductsListPage } from "@/pages/products/ProductsListPage"
import { ProductDetailPage } from "@/pages/products/ProductDetailPage"
import { StockLevelsPage } from "@/pages/products/StockLevelsPage"
import { BarcodeScanPage } from "@/pages/products/BarcodeScanPage"
import { ReceiptsListPage } from "@/pages/receipts/ReceiptsListPage"
import { ReceiptDetailPage } from "@/pages/receipts/ReceiptDetailPage"
import { DeliveriesListPage } from "@/pages/deliveries/DeliveriesListPage"
import { DeliveryDetailPage } from "@/pages/deliveries/DeliveryDetailPage"
import { NewTransferPage } from "@/pages/transfers/NewTransferPage"
import { NewAdjustmentPage } from "@/pages/adjustments/NewAdjustmentPage"
import { MoveHistoryPage } from "@/pages/ledger/MoveHistoryPage"
import { WarehousesPage } from "@/pages/settings/WarehousesPage"
import { LocationsPage } from "@/pages/settings/LocationsPage"
import { ProfilePage } from "@/pages/profile/ProfilePage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
})

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes wrapped by ProtectedRoute and AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Products Track (Member 2) */}
              <Route path="/products" element={<ProductsListPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/stock" element={<StockLevelsPage />} />
              <Route path="/scan" element={<BarcodeScanPage />} />

              {/* Operations Track: Receipts & Deliveries (Member 3) */}
              <Route path="/receipts" element={<ReceiptsListPage />} />
              <Route path="/receipts/:id" element={<ReceiptDetailPage />} />
              <Route path="/deliveries" element={<DeliveriesListPage />} />
              <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />

              {/* Operations Track: Internal & Adjustments (Member 4) */}
              <Route path="/transfers/new" element={<NewTransferPage />} />
              <Route path="/adjustments/new" element={<NewAdjustmentPage />} />

              {/* Ledger Track (Member 4) */}
              <Route path="/move-history" element={<MoveHistoryPage />} />

              {/* Settings & Profile Track (Member 1) */}
              <Route path="/settings/warehouses" element={<WarehousesPage />} />
              <Route path="/settings/locations" element={<LocationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
export default App
