'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SkeletonTable from '@/components/ui/SkeletonTable';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', departmentId: '', isActive: true });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, deptRes] = await Promise.all([adminAPI.getCategories(), adminAPI.getDepartments()]);
      setCategories(catRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCat) {
        await adminAPI.updateCategory(editCat._id, form);
        toast.success('Category updated');
      } else {
        await adminAPI.createCategory(form);
        toast.success('Category created');
      }
      setShowModal(false);
      setEditCat(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete({ open: true, id });
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({ name: cat.name, description: cat.description, departmentId: cat.departmentId?._id || cat.departmentId, isActive: cat.isActive });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', description: '', departmentId: departments[0]?._id || '', isActive: true });
    setShowModal(true);
  };

  const getDeptName = (cat) => cat.departmentId?.name || (typeof cat.departmentId === 'string' ? departments.find(d => d._id === cat.departmentId)?.name : '-');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Document Categories</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4"><Link href="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="text-gray-800 font-medium">Document Categories</span></nav>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-left px-4 py-3 font-medium">Department</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500"><SkeletonTable rows={5} cols={5} /></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5}><div className="flex flex-col items-center py-12 text-gray-400"><FolderTree className="w-12 h-12 mb-3 text-gray-300" /><p className="text-sm font-medium">No categories yet</p><p className="text-xs mt-1">Click "Add Category" to get started</p></div></td></tr>
            ) : categories.map((cat) => (
              <tr key={cat._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500">{cat.description || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{getDeptName(cat)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat._id)} className="p-1.5 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditCat(null); }} title={editCat ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditCat(null); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : editCat ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })} onConfirm={async () => { await adminAPI.deleteCategory(confirmDelete.id); toast.success('Category deleted'); load(); setConfirmDelete({ open: false, id: null }); }} title="Delete Category" message="Delete this category?" confirmText="Delete" variant="danger" />
    </div>
  );
}
