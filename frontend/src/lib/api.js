import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  createCustomer: (data) => api.post('/admin/customers', data),
  updateCustomer: (id, data) => api.put(`/admin/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/admin/customers/${id}`),
  resetPassword: (id) => api.put(`/admin/customers/${id}/reset-password`),
  setPassword: (id, data) => api.put(`/admin/customers/${id}/set-password`, data),
  getCustomerDocuments: (id, params) => api.get(`/admin/customers/${id}/documents`, { params }),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  updatePermissions: (id, data) => api.put(`/admin/departments/${id}/permissions`, data),
  getDepartmentUsers: (params) => api.get('/admin/department-users', { params }),
  getDeptUsersByDept: (deptId) => api.get(`/admin/department-users/department/${deptId}`),
  createDepartmentUser: (data) => api.post('/admin/department-users', data),
  updateDepartmentUser: (id, data) => api.put(`/admin/department-users/${id}`, data),
  deleteDepartmentUser: (id) => api.delete(`/admin/department-users/${id}`),
  resetDeptUserPassword: (id) => api.put(`/admin/department-users/${id}/reset-password`),
  setDeptUserPassword: (id, data) => api.put(`/admin/department-users/${id}/set-password`, data),
  getCategories: (params) => api.get('/admin/categories', { params }),
  getCategoriesByDept: (deptId) => api.get(`/admin/categories/department/${deptId}`),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getAllDocuments: (params) => api.get('/admin/documents', { params }),
  blockDocument: (id) => api.patch(`/admin/documents/${id}/block`),
  unblockDocument: (id) => api.patch(`/admin/documents/${id}/unblock`),
  updateDocument: (id, data) => api.put(`/admin/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/admin/documents/${id}`),
  purgeDocumentFiles: (id) => api.post(`/admin/documents/${id}/purge`),
  renameDocument: (id, data) => api.patch(`/admin/documents/${id}/rename`, data),
  renameGroup: (groupId, data) => api.patch(`/admin/documents/group/${groupId}/rename`, data),
  softDeleteDocument: (id, data) => api.delete(`/admin/documents/${id}/soft`, { data }),
  softDeleteGroup: (groupId) => api.delete(`/admin/documents/group/${groupId}/soft`),
  createFolder: (data) => api.post('/admin/documents/folder', data),
  uploadFilesToFolder: (groupId, formData) => api.post(`/admin/documents/group/${groupId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const customerAPI = {
  getCategories: () => api.get('/customer/categories'),
  getDepartments: () => api.get('/customer/departments'),
  getDocuments: (params) => api.get('/customer/documents', { params }),
  uploadDocument: (formData) => api.post('/customer/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadDocument: (id, type) => api.get(`/customer/documents/${id}/download`, { params: { type }, responseType: 'blob' }),
};

export const departmentAPI = {
  getDashboard: () => api.get('/department/dashboard'),
  getCustomers: (params) => api.get('/department/customers', { params }),
  getCustomerDocuments: (customerId, params) => api.get(`/department/customers/${customerId}/documents`, { params }),
  renameCustomer: (customerId, data) => api.patch(`/department/customers/${customerId}/rename`, data),
  getDocuments: (params) => api.get('/department/documents', { params }),
  getCategories: () => api.get('/department/categories'),
  getDocumentDetail: (id) => api.get(`/department/documents/${id}`),
  updateStatus: (id, data) => api.patch(`/department/documents/${id}/status`, data),
  uploadResult: (id, formData) => api.post(`/department/documents/${id}/upload-result`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  blockDocument: (id) => api.patch(`/department/documents/${id}/block`),
  unblockDocument: (id) => api.patch(`/department/documents/${id}/unblock`),
  updateNotes: (id, data) => api.put(`/department/documents/${id}/notes`, data),
  downloadFile: (id, type) => api.get(`/department/documents/${id}/download`, { params: { type }, responseType: 'blob' }),
  purgeDocumentFiles: (id) => api.post(`/department/documents/${id}/purge`),
  renameDocument: (id, data) => api.patch(`/department/documents/${id}/rename`, data),
  renameGroup: (groupId, data) => api.patch(`/department/documents/group/${groupId}/rename`, data),
  deleteDocument: (id, data) => api.delete(`/department/documents/${id}`, { data }),
  deleteGroup: (groupId) => api.delete(`/department/documents/group/${groupId}`),
  createFolder: (data) => api.post('/department/documents/folder', data),
  uploadFilesToFolder: (groupId, formData) => api.post(`/department/documents/group/${groupId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
