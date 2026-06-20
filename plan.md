# CA Consultancy Document Management System — Implementation Plan

## 📋 Overview

A full-stack document management system for a Chartered Accountant (CA) consultancy firm. Admin creates credentials for customers and department staff. Customers upload source documents to service categories (e.g., ITR Filing, GST, TDS). Department staff process these and upload result documents. Admin has full control over users, departments, categories, permissions, and document blocking.

**Tech Stack:** Node.js/Express backend + Next.js frontend + MongoDB + Local FS (→ AWS S3 later)

---

## 📁 Project Structure

```
whatsapp_automation/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Department.model.js
│   │   │   ├── Category.model.js
│   │   │   └── Document.model.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── role.js
│   │   │   ├── upload.js
│   │   │   └── errorHandler.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── department.controller.js
│   │   │   └── customer.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── department.routes.js
│   │   │   └── customer.routes.js
│   │   ├── services/
│   │   │   ├── storage.service.js
│   │   │   └── seed.service.js
│   │   ├── utils/
│   │   │   └── AppError.js
│   │   └── index.js
│   ├── uploads/
│   ├── .env
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.jsx
│   │   │   │   └── change-password/page.jsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.jsx
│   │   │   │   ├── dashboard/page.jsx
│   │   │   │   ├── customers/
│   │   │   │   │   ├── page.jsx
│   │   │   │   │   └── [id]/page.jsx
│   │   │   │   ├── departments/page.jsx
│   │   │   │   ├── department-users/page.jsx
│   │   │   │   ├── categories/page.jsx
│   │   │   │   └── documents/page.jsx
│   │   │   └── department/
│   │   │       ├── layout.jsx
│   │   │       ├── dashboard/page.jsx
│   │   │       ├── customers/
│   │   │       │   ├── page.jsx
│   │   │       │   └── [customerId]/page.jsx
│   │   │       └── documents/[id]/page.jsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── DataTable.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   └── StatusBadge.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminSidebar.jsx
│   │   │   │   ├── CustomerForm.jsx
│   │   │   │   ├── DepartmentForm.jsx
│   │   │   │   ├── DepartmentUserForm.jsx
│   │   │   │   └── CategoryForm.jsx
│   │   │   └── department/
│   │   │       ├── DeptSidebar.jsx
│   │   │       ├── CustomerFolderCard.jsx
│   │   │       └── DocumentActionPanel.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   └── utils.js
│   │   └── context/
│   │       └── AuthContext.jsx
│   └── package.json
│
└── package.json
```

---

## 🗄️ Database Models

### User
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt),
  role: enum['super_admin', 'department', 'customer'],
  departmentId: ref('Department'),  // only for department users
  isActive: Boolean,
  mustChangePassword: Boolean,
  createdBy: ref('User'),
  createdAt, updatedAt
}
```

### Department
```
{
  _id: ObjectId,
  name: String,
  description: String,
  isActive: Boolean,
  permissions: {
    blockDocuments: Boolean,
    viewCustomers: Boolean
  },
  createdBy: ref('User'),
  createdAt, updatedAt
}
```

### Category (Document Types)
```
{
  _id: ObjectId,
  name: String,                     // e.g. "Income Tax Return", "GST Filing"
  description: String,
  departmentId: ref('Department'),
  isActive: Boolean,
  createdBy: ref('User'),
  createdAt, updatedAt
}
```

### Document
```
{
  _id: ObjectId,
  customerId: ref('User'),
  categoryId: ref('Category'),
  departmentId: ref('Department'),
  title: String,
  direction: enum['submission', 'result'],

  // Customer's original file
  originalName: String,
  storedPath: String,
  mimeType: String,
  fileSize: Number,

  status: enum['pending', 'processing', 'completed', 'blocked'],
  paymentBlocked: Boolean,
  blockedAt: Date,
  blockedBy: ref('User'),

  // Department's processed file
  resultFile: {
    originalName: String,
    storedPath: String,
    mimeType: String,
    fileSize: Number,
    uploadedAt: Date,
    uploadedBy: ref('User')
  },

  notes: String,
  createdAt, updatedAt
}
```

---

## 🔐 Authentication & Authorization

- **No self-registration.** Admin creates all accounts.
- Login: email + password → JWT access token (15min) + refresh token (7 days)
- On first login, `mustChangePassword` flag forces password change.
- Admin sees plaintext passwords only at creation/reset time.
- Role middleware protects all routes: `super_admin`, `department`, `customer`
- Department users only see documents assigned to their department.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | All | Login → JWT pair |
| PUT | `/api/auth/change-password` | All | Change temp password |
| GET | `/api/auth/me` | All | Current user profile |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/dashboard` | Admin | Stats + recent activity |
| CRUD | `/api/admin/customers` | Admin | Create (returns password), list, edit, delete |
| GET | `/api/admin/customers/:id/documents` | Admin | All docs of a customer |
| PUT | `/api/admin/customers/:id/reset-password` | Admin | Reset + return new password |
| CRUD | `/api/admin/departments` | Admin | Full CRUD |
| PUT | `/api/admin/departments/:id/permissions` | Admin | Update permission toggles |
| CRUD | `/api/admin/department-users` | Admin | Create department logins |
| GET | `/api/admin/department-users/department/:deptId` | Admin | Users of a department |
| CRUD | `/api/admin/categories` | Admin | Document type categories |
| GET | `/api/admin/categories/department/:deptId` | Admin | Categories by department |
| GET | `/api/admin/documents` | Admin | All documents (filterable) |
| PATCH | `/api/admin/documents/:id/block` | Admin | Block for payment |
| PATCH | `/api/admin/documents/:id/unblock` | Admin | Unblock |
| DELETE | `/api/admin/documents/:id` | Admin | Delete document + file |

### Department
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/department/dashboard` | Dept | This department's stats |
| GET | `/api/department/customers` | Dept | Unique customers who submitted to this dept |
| GET | `/api/department/customers/:id/documents` | Dept | Customer's docs in this dept |
| GET | `/api/department/documents` | Dept | All docs in this dept (filterable) |
| GET | `/api/department/documents/:id` | Dept | Single doc detail + download |
| PATCH | `/api/department/documents/:id/status` | Dept | Update status |
| POST | `/api/department/documents/:id/upload-result` | Dept | Upload processed file |
| PATCH | `/api/department/documents/:id/block` | Dept | Block for payment |
| PATCH | `/api/department/documents/:id/unblock` | Dept | Unblock |
| PUT | `/api/department/documents/:id/notes` | Dept | Update notes |

### Customer
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/customer/categories` | Customer | Active categories grouped by dept |
| GET | `/api/customer/documents` | Customer | Own documents list |
| GET | `/api/customer/documents/:id/download` | Customer | Download result file |
| POST | `/api/customer/upload` | Customer | Upload file to a category |

---

## 🗂️ File Storage

```
uploads/
└── {customerId}/
    └── {categoryId}/
        ├── submissions/
        │   └── {timestamp}_{originalName}
        └── results/
            └── {timestamp}_{originalName}
```

**`storage.service.js`** interface:
- `saveSubmission(file, customerId, categoryId)` → metadata
- `saveResult(file, customerId, categoryId)` → metadata
- `getFilePath(storedPath)` → absolute path for download
- `deleteFile(storedPath)` → void

Swap to AWS S3 later by implementing the same interface with `@aws-sdk/client-s3`.

---

## 🖥️ Frontend Pages

### Admin Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin/dashboard` | Stat cards, bar chart, recent activity |
| Customers | `/admin/customers` | DataTable with CRUD, see credentials |
| Customer Detail | `/admin/customers/[id]` | Customer's documents list |
| Departments | `/admin/departments` | CRUD + permission toggles |
| Department Users | `/admin/department-users` | CRUD, filter by dept, see credentials |
| Categories | `/admin/categories` | CRUD, assign to department |
| Documents | `/admin/documents` | Master table, filters, block/unblock |

### Department Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/department/dashboard` | Pending/processing/completed counts |
| Customers | `/department/customers` | Customer "folder" cards with name & stats |
| Customer Docs | `/department/customers/[customerId]` | Documents of one customer in this dept |
| Document Detail | `/department/documents/[id]` | View, process, upload result, block/unblock |

---

## ✅ Implementation Tasks

### Phase 1: Backend Foundation
- [ ] 1. Init `/server` with package.json, install deps (multer, uuid, morgan, express-async-errors)
- [ ] 2. Express app setup (CORS, JSON, static files, error handler)
- [ ] 3. MongoDB connection + env config
- [ ] 4. User, Department, Category, Document models
- [ ] 5. Auth controller + routes (login, change-password, me)
- [ ] 6. Auth JWT middleware + role-check middleware

### Phase 2: Admin Backend APIs
- [ ] 7. Admin customers CRUD
- [ ] 8. Admin departments CRUD + permissions
- [ ] 9. Admin department-users CRUD
- [ ] 10. Admin categories CRUD
- [ ] 11. Admin documents list + block/unblock + delete
- [ ] 12. Admin dashboard stats endpoint

### Phase 3: Department & Customer Backend APIs
- [ ] 13. Department dashboard stats
- [ ] 14. Department customers list
- [ ] 15. Department documents list & detail
- [ ] 16. Department status change + upload result
- [ ] 17. Department block/unblock + notes
- [ ] 18. Customer categories list
- [ ] 19. Customer upload
- [ ] 20. Customer documents list + download
- [ ] 21. Storage service (Multer + local FS)
- [ ] 22. Seed script (default admin, sample data)

### Phase 4: Frontend Init & Auth
- [ ] 23. Init Next.js in `/client` with Tailwind CSS
- [ ] 24. Auth context, axios API client with JWT interceptor
- [ ] 25. Login page + Change password page
- [ ] 26. Protected route wrappers (AdminLayout, DeptLayout)

### Phase 5: Admin Frontend
- [ ] 27. Admin layout + sidebar
- [ ] 28. Dashboard page (stats cards + chart)
- [ ] 29. Customers list + CRUD modals
- [ ] 30. Customer detail page (their documents)
- [ ] 31. Departments list + CRUD modals + permissions
- [ ] 32. Department users list + CRUD modals
- [ ] 33. Categories list + CRUD modals
- [ ] 34. Master documents table with filters + actions

### Phase 6: Department Frontend
- [ ] 35. Department layout + sidebar
- [ ] 36. Dashboard page
- [ ] 37. Customers list (folder-style cards)
- [ ] 38. Customer documents page (within department)
- [ ] 39. Document detail page (view, process, upload, block)

### Phase 7: Polish
- [ ] 40. Loading states, skeletons, error boundaries
- [ ] 41. Toast notifications for all CRUD actions
- [ ] 42. Empty states, responsive design
- [ ] 43. File size limits, allowed MIME types validation

---

## 📦 Dependencies

### Server
- express, mongoose, jsonwebtoken, bcrypt, cors, dotenv
- multer, uuid, morgan, express-async-errors

### Client
- next, react, react-dom
- axios, tailwindcss, postcss, autoprefixer
- lucide-react (icons)
- recharts (charts)
- sonner (toast notifications)

---

## 🔮 Future Migrations

| Aspect | Now | Future |
|--------|-----|--------|
| File Storage | Local `uploads/` folder | AWS S3 via same interface |
| Customer App | Admin Dashboard (simulated) | React Native / Flutter mobile app |
| Notifications | None | Email/SMS on status changes |
| Payment | Manual block/unblock | Stripe/Razorpay integration |
| Real-time | Polling | WebSockets for live updates |
| Document Preview | Download link | PDF viewer, image preview |
