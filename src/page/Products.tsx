import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { API_BASE } from '../lib/utils';

interface Product {
  _id: string;
  name: string;
  category: string;
  sellingPrice: number;
  buyingPrice?: number;
  stock: number;
  description: string;
  barcode?: string;
}

const CATEGORIES = ['Cleaning', 'Bags', 'Cups', 'Paper', 'Containers', 'Home', 'Other'];

const emptyForm = { name: '', category: 'Other', sellingPrice: '', buyingPrice: '', stock: '', description: '', barcode: '' };

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {message}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [slideOpen, setSlideOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 1000);
    return () => clearTimeout(timer);
  }, [search, filter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filter) params.set('category', filter);
      params.set('limit', '100');
      params.set('sortBy', 'name');
      params.set('sortOrder', 'asc');
      const res = await fetch(`${API_BASE}/api/products/search?${params}`);
      const d = await res.json();
      if (d.success) setProducts(d.data);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setSlideOpen(true); };
  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      name: p.name, category: p.category,
      sellingPrice: String(p.sellingPrice), buyingPrice: String(p.buyingPrice ?? ''),
      stock: String(p.stock), description: p.description, barcode: p.barcode || '',
    });
    setSlideOpen(true);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const method = editTarget ? 'PUT' : 'POST';
      const url = editTarget ? `${API_BASE}/api/products/${editTarget._id}` : `${API_BASE}/api/products`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name, category: form.category,
          sellingPrice: Number(form.sellingPrice), buyingPrice: Number(form.buyingPrice),
          stock: Number(form.stock), barcode: form.barcode, description: form.description,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setToast({ message: editTarget ? 'Product updated' : 'Product added', type: 'success' });
        setSlideOpen(false);
        fetchProducts();
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
      const res = await fetch(`${API_BASE}/api/products/${confirmDelete._id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        setToast({ message: 'Product deleted', type: 'success' });
        setConfirmDelete(null);
        fetchProducts();
      } else {
        setToast({ message: d.message || 'Delete failed', type: 'error' });
      }
    } catch { setToast({ message: 'Network error', type: 'error' }); }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
          <PlusIcon className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Product list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No products found</div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-gray-100 md:hidden">
              {products.map(p => (
                <div key={p._id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                    <span className="inline-block mt-0.5 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{p.category}</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                      <span>${p.sellingPrice?.toFixed(2)}</span>
                      <span className={p.stock === 0 ? 'text-red-600 font-semibold' : p.stock <= 10 ? 'text-amber-600 font-semibold' : ''}>
                        Stock: {p.stock}
                      </span>
                      {p.barcode && <span className="font-mono">{p.barcode}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
                    <button onClick={() => openEdit(p)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => setConfirmDelete(p)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
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
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Price</th>
                    <th className="px-5 py-3 font-medium">Stock</th>
                    <th className="px-5 py-3 font-medium">Barcode</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-5 py-3">
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{p.category}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">${p.sellingPrice?.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-gray-700'}`}>{p.stock}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.barcode || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                          <button onClick={() => setConfirmDelete(p)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
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
          <div className="w-full max-w-[400px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editTarget ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setSlideOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {[
                { label: 'Product Name', key: 'name', type: 'text', placeholder: 'e.g. Garbage Bag 30L' },
                { label: 'Buying Price ($)', key: 'buyingPrice', type: 'number', placeholder: '0.00' },
                { label: 'Selling Price ($)', key: 'sellingPrice', type: 'number', placeholder: '0.00' },
                { label: 'Stock Quantity', key: 'stock', type: 'number', placeholder: '0' },
                { label: 'Barcode', key: 'barcode', type: 'text', placeholder: 'Optional' },
                { label: 'Description', key: 'description', type: 'text', placeholder: 'Optional' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${saving ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete product?</h3>
            <p className="text-sm text-gray-500 mb-6"><strong>{confirmDelete.name}</strong> will be permanently removed.</p>
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
