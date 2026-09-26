# StockSense — Modular Inventory Management System (IMS)

A real-time, multi-warehouse inventory management system scaffold built for rapid, non-conflicting parallel development during an 8-hour hackathon.

---

## ⚡ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Dark theme default: `#000000` background, `#FF5A36` warm orange accent)
- **UI Components**: shadcn/ui primitives (`table`, `dialog`, `dropdown-menu`, `input`, `badge`, `sheet`, `card`, `button`)
- **Navigation**: React Router v6
- **Data Fetching**: TanStack Query (v5)
- **Backend / DB**: Firebase Auth (with JWT tokens & OTP password recovery) + Cloud Firestore + Firestore Security Rules

---

## 👥 4-Person Parallel Development Tracks

To prevent merge conflicts during the 8-hour hackathon, each developer owns a clean set of files:

| Member | Track | Routes Owned | Primary Files |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Auth, Profile & Settings** | `/login`, `/signup`, `/reset-password`, `/profile`, `/settings/warehouses`, `/settings/locations` | `src/pages/auth/*`, `src/pages/profile/*`, `src/pages/settings/*`, `src/context/AuthContext.tsx` |
| **Member 2** | **Products & Catalog** | `/products`, `/products/:id`, `/stock`, `/scan` | `src/pages/products/*`, `src/types/index.ts` |
| **Member 3** | **Operations: Inbound & Outbound** | `/receipts`, `/receipts/:id`, `/deliveries`, `/deliveries/:id` | `src/pages/receipts/*`, `src/pages/deliveries/*` |
| **Member 4** | **Transfers, Adjustments & Ledger** | `/transfers/new`, `/adjustments/new`, `/move-history`, `/dashboard` | `src/pages/transfers/*`, `src/pages/adjustments/*`, `src/pages/ledger/*`, `src/pages/dashboard/*` |

---

## 📜 Shared Contracts & Invariants

All core types reside in [`src/types/index.ts`](./src/types/index.ts).

### 1. Document Lifecycle Status (`DocStatus`)
Used across Receipts, Deliveries, Transfers, and Adjustments:
```ts
export type DocStatus = "draft" | "waiting" | "ready" | "done" | "cancelled"
```

### 2. Stock Ledger Entry (`StockLedgerEntry`)
The stock ledger is the single source of truth for all inventory movements:
```ts
export interface StockLedgerEntry {
  id: string
  productId: string
  locationId: string
  qtyDelta: number // Positive for additions, negative for reductions
  refType: "receipt" | "delivery" | "transfer" | "adjustment"
  refId: string    // Document ID of the source transaction
  timestamp: string | number
  userId: string
  notes?: string
}
```

### 3. Inventory Operations Invariants
When validating operations, adhere to these contract rules:
1. **Receipts (Incoming)**:
   - Validate sets `status = "done"`
   - `stock_levels[productId, locationId].onHand += qty`
   - Log to `stock_ledger` with `refType: "receipt"`, `qtyDelta: +qty`
2. **Deliveries (Outgoing)**:
   - Validate sets `status = "done"`
   - `stock_levels[productId, locationId].onHand -= qty`
   - Log to `stock_ledger` with `refType: "delivery"`, `qtyDelta: -qty`
3. **Internal Transfers**:
   - Total stock across company remains unchanged
   - Decrement from source location: `-qty`
   - Increment in destination location: `+qty`
   - Log 2 linked ledger movements or 1 transfer movement with `refType: "transfer"`
4. **Stock Adjustments**:
   - Difference calculated: `difference = countedQty - recordedQty`
   - `stock_levels[productId, locationId].onHand = countedQty`
   - Log to `stock_ledger` with `refType: "adjustment"`, `qtyDelta: difference`

---

## 🗄️ Firestore Database & Collections

Typed collection helpers and Firestore data converters are pre-configured in [`src/lib/firestore.ts`](./src/lib/firestore.ts):

- `warehousesCol`: `CollectionReference<Warehouse>`
- `locationsCol`: `CollectionReference<Location>`
- `productsCol`: `CollectionReference<Product>`
- `categoriesCol`: `CollectionReference<ProductCategory>`
- `stockLevelsCol`: `CollectionReference<StockLevel>`
- `receiptsCol`: `CollectionReference<Receipt>`
- `deliveriesCol`: `CollectionReference<Delivery>`
- `transfersCol`: `CollectionReference<Transfer>`
- `adjustmentsCol`: `CollectionReference<Adjustment>`
- `stockLedgerCol`: `CollectionReference<StockLedgerEntry>`
- `usersCol`: `CollectionReference<UserProfile>`

Security rules are defined in [`firestore.rules`](./firestore.rules) requiring authentication on all collections.

---

## 🔐 Authentication & JWT Tokens

- **Email/Password**: Standard sign in and sign up.
- **OTP Password Recovery**: 2-step password reset on `/reset-password`.
- **JWT Authorization**: Retrieve the active JWT token anywhere using:
  ```ts
  import { useAuth } from "@/context/AuthContext"
  
  const { user, token, logout } = useAuth()
  // token contains the Firebase ID Token (JWT)
  ```
- **Protected Routes**: Wrap any private view or layout with `<ProtectedRoute>`:
  ```tsx
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    ...
  </Route>
  ```
- **Zero-Setup Dev Mode**: If Firebase credentials are not yet configured in `.env`, the app automatically switches to an in-memory session with demo credentials (`manager@stocksense.io` / `password123`) and a simulated JWT token.

---

## 📂 File Structure

```text
├── firestore.rules               # Starter security rules requiring auth
├── index.html                    # Dark HTML shell with Inter font
├── package.json                  # Dependencies (React 18, Router v6, TanStack Query, Radix)
├── tailwind.config.js            # Dark theme & #FF5A36 warm accent colors
├── vite.config.ts                # Vite with @/ path alias
└── src/
    ├── App.tsx                   # React Router v6 route configuration
    ├── index.css                 # Dark theme CSS tokens & scrollbars
    ├── main.tsx                  # React DOM mount point
    ├── components/
    │   ├── auth/
    │   │   └── ProtectedRoute.tsx # Route guard checking user auth & JWT
    │   ├── layout/
    │   │   └── AppLayout.tsx     # Left-nav sidebar, mobile drawer, logout
    │   └── ui/                   # Pre-added shadcn/ui components
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── sheet.tsx
    │       └── table.tsx
    ├── context/
    │   └── AuthContext.tsx       # Auth provider, JWT token, OTP reset flow
    ├── lib/
    │   ├── firebase.ts           # Firebase SDK initialization
    │   ├── firestore.ts          # Typed Firestore collections & converters
    │   └── utils.ts              # cn classnames utility
    ├── pages/
    │   ├── auth/
    │   │   ├── LoginPage.tsx
    │   │   ├── SignupPage.tsx
    │   │   └── ResetPasswordPage.tsx
    │   ├── dashboard/
    │   │   └── DashboardPage.tsx
    │   ├── deliveries/
    │   │   ├── DeliveriesListPage.tsx
    │   │   └── DeliveryDetailPage.tsx
    │   ├── ledger/
    │   │   └── MoveHistoryPage.tsx
    │   ├── products/
    │   │   ├── BarcodeScanPage.tsx
    │   │   ├── ProductDetailPage.tsx
    │   │   ├── ProductsListPage.tsx
    │   │   └── StockLevelsPage.tsx
    │   ├── profile/
    │   │   └── ProfilePage.tsx
    │   ├── receipts/
    │   │   ├── ReceiptDetailPage.tsx
    │   │   └── ReceiptsListPage.tsx
    │   ├── settings/
    │   │   ├── LocationsPage.tsx
    │   │   └── WarehousesPage.tsx
    │   └── transfers/
    │       ├── NewAdjustmentPage.tsx
    │       └── NewTransferPage.tsx
    └── types/
        └── index.ts              # DocStatus, StockLedgerEntry, Product, etc.
```

---

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Launch Vite dev server
npm run dev

# 3. Typecheck / Build
npm run build
```
Navigate to `http://localhost:5173` to see the live login screen. Click **"Auto-fill Demo Credentials"** to log in and explore the full sidebar navigation and route stubs.
