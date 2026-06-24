# CA Consultancy Document Management System — Implementation Plan

## Overview

A full-stack document management system for a Chartered Accountant (CA) consultancy firm. Admin creates accounts. Customers submit requests to departments. Department staff read requests and create response documents with file categories.

**Tech Stack:** Node.js/Express backend + Next.js frontend + MongoDB + Local FS

---

## Architecture

### Roles
- **super_admin**: Full control over users, departments, categories, file categories, documents
- **department**: Views customer requests assigned to their dept, creates response documents
- **customer**: Submits requests to departments, views response documents

### Core Concepts
- **Department**: e.g. GST Department, Loan Department — customer selects when submitting
- **Category**: Service category tied to a department (e.g. "ITR Filing", "GST Filing")
- **FileCategory**: Category for response documents (e.g. "Tax Return File", "Other Docs") — managed by admin
- **Submission**: Customer-uploaded file with description, sent to a department
- **Response**: Department-created document in response to a customer request, uploaded with a file category

---

## Database Models

### User
```
{ name, email, password (bcrypt), role: enum[super_admin|department|customer],
  departmentId, isActive, mustChangePassword, canRename, canDelete, canCreate,
  createdBy, timestamps }
```

### Department
```
{ name, description, isActive,
  permissions: { blockDocuments, viewCustomers },
  createdBy, timestamps }
```

### Category (Service Types — what customers submit to)
```
{ name, description, departmentId, isActive, createdBy, timestamps }
index: { name: 1, departmentId: 1 } unique
```

### FileCategory (Response Document Types — what departments respond with)
```
{ name, description, departmentId, isActive, createdBy, timestamps }
index: { name: 1, departmentId: 1 } unique
```

### Document
```
{
  customerId, departmentId,
  categoryId (ref Category — for submissions),
  fileCategoryId (ref FileCategory — for responses),
  title, description,
  direction: enum[submission|response],
  groupId,
  originalName, storedPath, mimeType, fileSize,
  status: enum[pending|processing|completed|blocked],
  paymentBlocked, blockedAt, blockedBy,
  notes,
  isDeleted,
  requiresResult,
  fileDeletedFromStorage,
  resultFileDeletedFromStorage, purgedAt, purgedBy,
  timestamps
}
indexes: { customerId: 1, departmentId: 1 }, { departmentId: 1, status: 1 }
```

### Notification
```
{ userId, type: enum[new_request|new_response], message, link, isRead, timestamps }
index: { userId: 1, isRead: 1, createdAt: -1 }
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/login | All | Login → JWT pair |
| PUT | /api/auth/change-password | All | Change password |
| GET | /api/auth/me | All | Current user |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/admin/dashboard | Admin | Stats |
| CRUD | /api/admin/customers | Admin | Full CRUD |
| GET | /api/admin/customers/:id/documents | Admin | Customer docs |
| PUT | /api/admin/customers/:id/reset-password | Admin | Reset |
| PUT | /api/admin/customers/:id/set-password | Admin | Set password |
| CRUD | /api/admin/departments | Admin | Full CRUD |
| PUT | /api/admin/departments/:id/permissions | Admin | Permissions |
| CRUD | /api/admin/department-users | Admin | Dept user CRUD |
| CRUD | /api/admin/categories | Admin | Service categories |
| CRUD | /api/admin/file-categories | Admin | File categories |
| GET | /api/admin/documents | Admin | All documents |

### Department
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/department/dashboard | Dept | Stats |
| GET | /api/department/customers | Dept | Customer list |
| GET | /api/department/customers/:id/documents | Dept | Submissions |
| PATCH | /api/department/customers/:id/rename | Dept | Rename customer |
| GET | /api/department/documents | Dept | All documents |
| GET | /api/department/documents/:id | Dept | Detail |
| PATCH | /api/department/documents/:id/status | Dept | Update status |
| POST | /api/department/responses | Dept | Create response doc |
| GET | /api/department/responses | Dept | List responses |
| GET | /api/department/file-categories | Dept | List file categories |
| PATCH | /api/department/documents/:id/block | Dept | Block |
| PATCH | /api/department/documents/:id/unblock | Dept | Unblock |
| PUT | /api/department/documents/:id/notes | Dept | Notes |
| GET | /api/department/documents/:id/download | Dept | Download |
| POST | /api/department/documents/:id/purge | Dept | Purge files |
| POST | /api/department/documents/batch | Dept | Batch ops |

### Customer
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/customer/categories | Customer | File categories with responses |
| GET | /api/customer/departments | Customer | Active departments |
| GET | /api/customer/documents | Customer | Own submissions |
| GET | /api/customer/responses | Customer | Response documents |
| GET | /api/customer/response-categories | Customer | File categories with response counts |
| GET | /api/customer/documents/:id/download | Customer | Download |
| POST | /api/customer/upload | Customer | Submit files |

### Notifications (All authenticated)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/notifications | All | Unread notifications |
| GET | /api/notifications/count | All | Unread count |
| DELETE | /api/notifications/:id | All | Mark read + delete |

---

## File Storage Layout

```
uploads/
├── customers/{customerName}/{customerEmail}/{categoryId}/
│   └── submissions/{timestamp}_{filename}
└── responses/{customerName}_{customerEmail}/{fileCategoryId}/
    └── {timestamp}_{filename}
```

---

## Frontend Pages

### Admin
| Page | Route |
|------|-------|
| Dashboard | /admin/dashboard |
| Customers | /admin/customers |
| Customer Detail | /admin/customers/[id] |
| Departments | /admin/departments |
| Dept Users | /admin/department-users |
| Categories | /admin/categories |
| File Categories | /admin/file-categories |
| Documents | /admin/documents |

### Department
| Page | Route |
|------|-------|
| Dashboard | /department/dashboard |
| Customers | /department/customers |
| Customer Docs | /department/customers/[customerId] |
| Responses | /department/responses |

### Customer
| Page | Route |
|------|-------|
| Dashboard | /customer/dashboard |
| Categories | /customer/categories |
| Upload | /customer/upload |
| Documents | /customer/documents |
| Responses | /customer/responses |

---

## Implementation Order

### Phase 1: Backend Models & Admin CRUD
- [x] FileCategory model
- [x] Notification model
- [x] Admin FileCategory CRUD
- [x] Update Document model (fileCategoryId, direction: 'response')

### Phase 2: Create Response (Department)
- [x] saveResponse in storage service
- [x] createResponse endpoint
- [x] getResponses endpoint (department)
- [x] getFileCategories endpoint (department)
- [x] Remove old uploadResult
- [x] Auto-notify on customer submission
- [x] Notification controller + routes

### Phase 3: Customer Response Views
- [x] Customer getResponses + getResponseCategories
- [x] Rework customer categories page for FileCategory

### Phase 4: Frontend Notifications
- [x] NotificationBell component
- [x] Integrate in all layouts

### Phase 5: Department Frontend Rework
- [x] Description visibility in file listing
- [x] Create Response UI (replace Upload Result)
- [x] Responses view

### Phase 6: Customer Frontend
- [x] Rework categories page
- [x] Responses page
