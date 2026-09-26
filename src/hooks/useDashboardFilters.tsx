import React, { createContext, useContext, useState, useMemo } from "react"
import type { DashboardFiltersState, DocTypeFilter, StatusFilter } from "@/types"

export interface DashboardFiltersContextType {
  filters: DashboardFiltersState
  setDocType: (docType: DocTypeFilter) => void
  setStatus: (status: StatusFilter) => void
  setWarehouseId: (warehouseId: string) => void
  setCategoryId: (categoryId: string) => void
  setFilters: React.Dispatch<React.SetStateAction<DashboardFiltersState>>
  resetFilters: () => void
  isFiltered: boolean
}

export const INITIAL_DASHBOARD_FILTERS: DashboardFiltersState = {
  docType: "all",
  status: "all",
  warehouseId: "all",
  categoryId: "all",
}

const DashboardFiltersContext = createContext<DashboardFiltersContextType | undefined>(undefined)

/**
 * Shared state provider for Dashboard dynamic filters
 */
export const DashboardFiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<DashboardFiltersState>(INITIAL_DASHBOARD_FILTERS)

  const setDocType = (docType: DocTypeFilter) => {
    setFilters((prev) => ({ ...prev, docType }))
  }

  const setStatus = (status: StatusFilter) => {
    setFilters((prev) => ({ ...prev, status }))
  }

  const setWarehouseId = (warehouseId: string) => {
    setFilters((prev) => ({ ...prev, warehouseId }))
  }

  const setCategoryId = (categoryId: string) => {
    setFilters((prev) => ({ ...prev, categoryId }))
  }

  const resetFilters = () => {
    setFilters(INITIAL_DASHBOARD_FILTERS)
  }

  const isFiltered = useMemo(() => {
    return (
      filters.docType !== "all" ||
      filters.status !== "all" ||
      filters.warehouseId !== "all" ||
      filters.categoryId !== "all"
    )
  }, [filters])

  return (
    <DashboardFiltersContext.Provider
      value={{
        filters,
        setDocType,
        setStatus,
        setWarehouseId,
        setCategoryId,
        setFilters,
        resetFilters,
        isFiltered,
      }}
    >
      {children}
    </DashboardFiltersContext.Provider>
  )
}

/**
 * Hook to consume or bind form controls to the shared Dashboard filters
 */
export function useDashboardFilters(): DashboardFiltersContextType {
  const context = useContext(DashboardFiltersContext)
  if (!context) {
    throw new Error("useDashboardFilters must be used within a DashboardFiltersProvider")
  }
  return context
}
