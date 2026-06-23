# Upcoming UX Features

## Phase 1: Quick Frontend Wins

| # | Feature | What | Files |
|---|---------|------|-------|
| 1 | **ConfirmModal** | Replace native `confirm()` with custom danger-styled modal | **New:** `frontend/src/components/ui/ConfirmModal.jsx` — **Edit:** `admin/documents`, `admin/departments`, `admin/customers`, `admin/department-users`, `admin/categories`, `[customerId]` |
| 2 | **Skeleton loading** | Replace `"Loading..."` text with animated table rows | `admin/customers`, `admin/department-users`, `admin/categories` |
| 3 | **Keyboard shortcuts** | Delete, F2 rename, Ctrl+N folder, Ctrl+E upload in explorers | `admin/documents`, `customer/documents`, `[customerId]` |
| 4 | **Drag-and-drop upload** | Drop zone overlay with visual indicator | `customer/upload`, `admin/documents`, `[customerId]` |
| 5 | **Remember me** | Persist token in localStorage with 7d expiry vs session-only | `context/AuthContext`, `login/page` |
| 6 | **Unsaved changes** | `beforeunload` + route guard when forms are dirty | `customer/upload`, `admin/documents`, `[customerId]` |
| 7 | **Page transitions** | `npm install framer-motion` + fade-in on each page | All pages — wrap root div with `<motion.div>` |
| 8 | **Empty states** | Helpful copy + CTA button instead of bare "No items" | ~8 explorer/dashboard pages |
| 9 | **Hover cards** | Tooltip with status/size/date on document row hover | Explorer pages |
| 10 | **Scroll-to-top** | Floating button after 300px scroll | **New:** `ScrollToTop.jsx` — injected into layouts |

## Phase 2: Navigation & Wayfinding

| # | Feature | Description |
|---|---------|-------------|
| 11 | **Filter/search in URL** | Sync filters with `?search=&status=` — bookmarkable, browser back works |
| 12 | **CRUD breadcrumbs** | "Dashboard > Customers" row above admin tables |
| 13 | **Recent items** | Last 5 visited items tracked in localStorage, shown in sidebar |
| 14 | **First-time tour** | 3-step overlay on first login (sidebar, explorer, upload) |

## Phase 3: Bulk & Data (backend + frontend)

| # | Feature | Changes |
|---|---------|---------|
| 15 | **Pagination** | Backend: `?page=&limit=` params. Frontend: Pagination comp + page size on 15 list pages |
| 16 | **Bulk operations** | Backend: `POST /admin/documents/batch`. Frontend: row checkboxes |
| 17 | **Select-all bar** | Header checkbox + floating bar with "3 selected" + actions |
| 18 | **Rows per page** | Dropdown 10/25/50/100, saved to localStorage |
| 19 | **Global search** | Backend: `GET /search?q=`. Frontend: header search bar with results dropdown |

## Phase 4: Deep UX

| # | Feature | Description |
|---|---------|-------------|
| 20 | **Inline file preview** | Render PDF/Image in right panel instead of just metadata |
| 21 | **Batch folder+upload** | One dialog to create folder AND upload files simultaneously |

## Phase 5: Polish

| # | Feature | Description |
|---|---------|-------------|
| 22 | **Column sort indicators** | Highlight active sort column with arrow |
| 23 | **Scroll hint on tables** | Gradient fade on right edge of overflow tables |
| 24 | **Loading button states** | Spinner + disabled on all async action buttons |
| 25 | **Feedback button** | "Report a problem" link in sidebar footer |

---

### Backend work required
- `?page=X&limit=Y` params on `GET /admin/customers`, `/admin/documents`, `/department/customers`, etc.
- `POST /admin/documents/batch` — batch status/block/delete
- `POST /department/documents/batch`
- `GET /search?q=text` — search customers + documents

### npm install required
- `framer-motion` (Phase 1 — page transitions)
