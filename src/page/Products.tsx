import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { API_BASE } from '../lib/utils';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  category: Category | string;
  sellingPrice: number;
  buyingPrice?: number;
  stock: number;
  description: string;
  barcode?: string;
  images?: string[];
}

const emptyForm = { name: '', category: '', sellingPrice: '', buyingPrice: '', stock: '', description: '', barcode: '' };

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/products/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setProducts(d.data);
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditTarget(null); setForm(emptyForm);
    setImageFile(null); setImagePreview('');
    setSlideOpen(true);
  };
  const getCategoryName = (cat: Category | string) =>
    typeof cat === 'object' ? cat.name : cat;

  const openEdit = (p: Product) => {
    setEditTarget(p);
    const catId = typeof p.category === 'object' ? p.category._id : p.category;
    setForm({
      name: p.name, category: catId,
      sellingPrice: String(p.sellingPrice), buyingPrice: String(p.buyingPrice ?? ''),
      stock: String(p.stock), description: p.description, barcode: p.barcode || '',
    });
    setImageFile(null);
    setImagePreview(p.images?.[0] || '');
    setSlideOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const method = editTarget ? 'PUT' : 'POST';
      const url = editTarget ? `${API_BASE}/api/products/${editTarget._id}` : `${API_BASE}/api/products`;

      let res: Response;
      if (imageFile) {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('category', form.category);
        fd.append('sellingPrice', form.sellingPrice);
        fd.append('buyingPrice', form.buyingPrice);
        fd.append('stock', form.stock);
        fd.append('barcode', form.barcode);
        fd.append('description', form.description);
        fd.append('image', imageFile);
        res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      } else {
        res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: form.name, category: form.category,
            sellingPrice: Number(form.sellingPrice), buyingPrice: Number(form.buyingPrice),
            stock: Number(form.stock), barcode: form.barcode, description: form.description,
          }),
        });
      }

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
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
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
                    <span className="inline-block mt-0.5 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{getCategoryName(p.category)}</span>
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
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{getCategoryName(p.category)}</span>
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
              {/* Image upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
                        Change
                      </button>
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-xs font-medium hover:bg-red-50">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                    <PhotoIcon className="w-8 h-8" />
                    <span className="text-xs">Click to upload image</span>
                  </button>
                )}
              </div>

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
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
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
