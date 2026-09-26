<<<<<<< HEAD
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
#   I n v e n t o r y - M a n a g e m e n t - S y s t e m  
 
=======
# StockSense — Inventory Management System

A full-stack, modular Inventory Management System (IMS) that replaces manual registers, Excel sheets, and scattered tracking with a centralized, real-time web app.

## Tech Stack

| Layer        | Technology                                       |
|-------------|--------------------------------------------------|
| Frontend    | React 18 + Vite + TypeScript, Tailwind CSS, React Router, React Query |
| Backend     | Node.js + Express + TypeScript                    |
| Database    | PostgreSQL + Prisma ORM                           |
| Auth        | JWT (access + refresh tokens), bcrypt, OTP-based password reset |
| Monorepo    | npm workspaces: `/apps/web`, `/apps/api`, `/packages/shared` |

## Features

- **Authentication**: Sign up, login, OTP-based password reset (console-logged for dev)
- **Dashboard**: KPI cards (total products, low/out of stock, pending receipts/deliveries/transfers), low stock alerts
- **Product Management**: CRUD with categories, UoM, per-location stock, reorder rules
- **Receipts**: Incoming goods from suppliers with validation → auto stock increase
- **Delivery Orders**: Outgoing goods with Pick → Pack → Validate workflow → auto stock decrease
- **Internal Transfers**: Move stock between locations (total unchanged, location-scoped)
- **Stock Adjustments**: Correct mismatches between recorded & physical count
- **Move History**: Full ledger of every stock movement, filterable by type/product/date
- **Warehouse Settings**: Multi-warehouse with hierarchical locations
- **Profile Management**: View/edit profile, change password

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

## Setup

### 1. Clone and install dependencies

```bash
cd Stock
npm install
```

### 2. Configure environment

```bash
cp .env.example apps/api/.env
# Edit apps/api/.env with your PostgreSQL credentials
```

Key variables:
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/stocksense` |
| `JWT_SECRET` | JWT signing secret | (set your own) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (set your own) |
| `PORT` | API port | `3001` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5173` |

### 3. Create the database

```bash
createdb stocksense
# Or via psql: CREATE DATABASE stocksense;
```

### 4. Run migrations and seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Start the app

```bash
npm run dev
```

This starts both:
- **API** at http://localhost:3001
- **Frontend** at http://localhost:5173

## Demo Credentials

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@stocksense.com      | password123 |
| Manager | manager@stocksense.com    | password123 |
| Staff   | staff@stocksense.com      | password123 |

## Project Structure

```
Stock/
├── apps/
│   ├── api/                  # Express backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   └── seed.ts       # Seed data
│   │   └── src/
│   │       ├── index.ts      # App entry
│   │       ├── middleware/    # Auth middleware
│   │       ├── routes/        # All API routes
│   │       ├── utils/         # Prisma client, helpers
│   │       └── __tests__/     # Validation tests
│   └── web/                  # React frontend
│       └── src/
│           ├── components/    # Reusable components (DataTable, StatusBadge, Modal, Layout, Sidebar)
│           ├── context/       # Auth context
│           ├── lib/           # API client
│           └── pages/         # All page components
├── packages/
│   └── shared/               # Shared TypeScript types
├── .env.example
└── package.json              # Root workspace config
```

## API Routes

### Public
- `POST /auth/signup` — Register
- `POST /auth/login` — Login
- `POST /auth/otp/request` — Request OTP
- `POST /auth/otp/verify` — Verify OTP
- `POST /auth/reset-password` — Reset password

### Protected (JWT required)
- `GET /dashboard/kpis` — Dashboard KPIs
- `GET /dashboard/filters` — Available filters
- `GET/POST/PUT/DELETE /products` — Product CRUD
- `GET /products/:id/stock` — Per-location stock
- `GET/POST/PUT/DELETE /categories` — Category CRUD
- `GET/POST /receipts` — List/create receipts
- `GET/PUT /receipts/:id` — Get/update receipt
- `POST /receipts/:id/validate` — Validate receipt (stock +)
- `GET/POST /delivery-orders` — List/create deliveries
- `GET/PUT /delivery-orders/:id` — Get/update delivery
- `POST /delivery-orders/:id/pick` — Pick items
- `POST /delivery-orders/:id/pack` — Pack items
- `POST /delivery-orders/:id/validate` — Validate delivery (stock -)
- `GET/POST /transfers` — List/create transfers
- `POST /transfers/:id/validate` — Validate transfer
- `GET/POST /adjustments` — List/create adjustments
- `POST /adjustments/:id/validate` — Validate adjustment
- `GET /move-history` — Move history with filters
- `GET/POST/PUT /warehouses` — Warehouse CRUD
- `GET/POST/PUT /locations` — Location CRUD
- `GET/PUT /profile` — User profile

## Testing

```bash
npm run test
```

Tests cover the critical "validate" endpoints to ensure stock correctness:
- Receipt validation → stock increases at destination
- Delivery validation → stock decreases at source (+ insufficient stock rejection)
- Transfer validation → stock moves between locations (total unchanged)
- Adjustment validation → stock corrected to counted quantity

## Assumptions

1. **Supplier/Customer IDs**: Stored as plain strings (not foreign keys) since supplier/customer management is out of scope. In production, these would reference separate supplier/customer tables.
2. **OTP Delivery**: OTP codes are logged to the console in dev. In production, integrate an email service (SendGrid, AWS SES, etc.).
3. **Authorization**: All authenticated users can access all features. Role-based access control (RBAC) is modeled (role field exists) but not enforced at the route level — extend middleware for production.
4. **Reference Numbers**: Auto-generated with date + counter format. The counter resets when the server restarts; use a DB sequence for production.
5. **File Uploads**: Product images are not included. Add multer + S3/local storage if needed.
6. **Pagination**: Default page size is 20 for most lists, 30 for move history.
# Inventory-Management-System
>>>>>>> fec53b6 (UX change)
