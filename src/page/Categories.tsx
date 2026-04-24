import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE } from '../lib/utils';

interface Category {
  _id: string;
  name: string;
  description: string;
  createdBy?: { name: string; email: string };
  isActive: boolean;
  createdAt: string;
}

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {message}
    </div>
  );
}

const emptyForm = { name: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const d = await res.json();
      if (d.success) setCategories(d.data);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setSlideOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditTarget(c);
    setForm({ name: c.name, description: c.description || '' });
    setSlideOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setToast({ message: 'Category name is required', type: 'error' });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const method = editTarget ? 'PUT' : 'POST';
      const url = editTarget
        ? `${API_BASE}/api/categories/${editTarget._id}`
        : `${API_BASE}/api/categories`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        setToast({ message: editTarget ? 'Category updated' : 'Category created', type: 'success' });
        setSlideOpen(false);
        fetchCategories();
      } else {
        setToast({ message: d.message || 'Save failed', type: 'error' });
      }
    } catch { setToast({ message: 'Network error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/categories/${confirmDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        setToast({ message: 'Category deleted', type: 'success' });
        setConfirmDelete(null);
        fetchCategories();
      } else {
        setToast({ message: d.message || 'Delete failed', type: 'error' });
      }
    } catch { setToast({ message: 'Network error', type: 'error' }); }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
          <PlusIcon className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No categories yet. Add one to get started.</div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-gray-100 md:hidden">
              {categories.map(c => (
                <div key={c._id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                    {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
                    <button onClick={() => openEdit(c)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => setConfirmDelete(c)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Created By</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-5 py-3 text-gray-500">{c.description || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{c.createdBy?.name || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(c)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                          <button onClick={() => setConfirmDelete(c)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Slide-over form */}
      {slideOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSlideOpen(false)} />
          <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editTarget ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setSlideOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Electronics"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Optional description"
                  value={form.description}
                  rows={3}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${saving ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete category?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{confirmDelete.name}</strong> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
