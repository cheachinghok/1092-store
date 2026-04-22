import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { API_BASE } from '../lib/utils';

interface Product {
  _id: string;
  name: string;
  stock: number;
  category: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
}

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      {message}
    </div>
  );
}

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'stock-out' ? 'stock-out' : searchParams.get('tab') === 'low-stock' ? 'low-stock' : 'stock-in';
  const [tab, setTab] = useState(defaultTab);

  // All products — used for stock-in search dropdown
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Low-stock list from dedicated endpoint
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = useState(false);
  const [threshold] = useState(() => parseInt(localStorage.getItem('lowStockThreshold') || '10'));

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(message);
    setToastType(type);
  };

  // Fetch all products for the stock-in search dropdown
  useEffect(() => {
    const prefillId = searchParams.get('product');
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProducts(d.data);
          if (prefillId) {
            const found = d.data.find((p: Product) => p._id === prefillId);
            if (found) setSelectedProduct(found);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch low-stock products from dedicated endpoint
  const fetchLowStock = useCallback(() => {
    const token = localStorage.getItem('token');
    setLowStockLoading(true);
    fetch(`${API_BASE}/api/products/low-stock?threshold=${threshold}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setLowStockProducts(d.data); })
      .catch(() => {})
      .finally(() => setLowStockLoading(false));
  }, [threshold]);

  useEffect(() => { fetchLowStock(); }, [fetchLowStock]);

  const filteredSearch = products.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Stock-in: call PATCH /api/products/:id/stock-in
  const handleStockIn = async () => {
    if (!selectedProduct || !qty) return;
    const token = localStorage.getItem('token');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${selectedProduct._id}/stock-in`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: parseInt(qty, 10) }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(d.message ?? `Stock in recorded: ${selectedProduct.name} × ${qty}`);
        // Update stock in the local products list
        setProducts(prev => prev.map(p => p._id === selectedProduct._id ? { ...p, stock: d.data.stock } : p));
        // Refresh low-stock list to reflect new stock levels
        fetchLowStock();
        setSelectedProduct(null);
        setQty('');
        setNote('');
        setProductSearch('');
      } else {
        showToast(d.message ?? 'Failed to update stock', 'error');
      }
    } catch {
      showToast('Network error — please try again', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Stock-out: no API endpoint — UI only
  const handleStockOut = () => {
    if (!selectedProduct || !qty) return;
    showToast(`Stock out recorded: ${selectedProduct.name} × ${qty} (UI Only)`);
    setSelectedProduct(null);
    setQty('');
    setNote('');
    setProductSearch('');
  };

  const handleConfirm = tab === 'stock-in' ? handleStockIn : handleStockOut;

  const tabs = [
    { key: 'stock-in', label: 'Stock In' },
    { key: 'stock-out', label: 'Stock Out' },
    { key: 'low-stock', label: `Low Stock (${lowStockProducts.length})` },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {toast && <Toast message={toast} type={toastType} onDone={() => setToast('')} />}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stock In */}
      {tab === 'stock-in' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Product search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            {selectedProduct ? (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-500">Current stock: {selectedProduct.stock}</p>
                </div>
                <button onClick={() => { setSelectedProduct(null); setProductSearch(''); }} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search product…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {productSearch && filteredSearch.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                    {filteredSearch.map(p => (
                      <button key={p._id} onClick={() => { setSelectedProduct(p); setProductSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex justify-between">
                        <span className="font-medium text-gray-800">{p.name}</span>
                        <span className="text-gray-400">Stock: {p.stock}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input type="number" min="1" placeholder="0" value={qty} onChange={e => setQty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. Purchase from supplier" value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedProduct || !qty || submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {submitting ? 'Saving…' : 'Confirm Stock In'}
          </button>
        </div>
      )}

      {/* Stock Out (UI only — no API endpoint) */}
      {tab === 'stock-out' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            UI Only — stock-out API endpoint not available.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            {selectedProduct ? (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-500">Current stock: {selectedProduct.stock}</p>
                </div>
                <button onClick={() => { setSelectedProduct(null); setProductSearch(''); }} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search product…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {productSearch && filteredSearch.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                    {filteredSearch.map(p => (
                      <button key={p._id} onClick={() => { setSelectedProduct(p); setProductSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex justify-between">
                        <span className="font-medium text-gray-800">{p.name}</span>
                        <span className="text-gray-400">Stock: {p.stock}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input type="number" min="1" placeholder="0" value={qty} onChange={e => setQty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. Damaged goods" value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedProduct || !qty}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Confirm Stock Out
          </button>
        </div>
      )}

      {/* Low Stock — data from GET /api/products/low-stock */}
      {tab === 'low-stock' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Products with stock ≤ {threshold} units</p>
            <button onClick={fetchLowStock} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Refresh</button>
          </div>
          {lowStockLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
          ) : lowStockProducts.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No low-stock products</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Buy / Sell</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockProducts.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500">{p.category}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      ${p.buyingPrice.toFixed(2)} / ${p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          setTab('stock-in');
                          setSelectedProduct({ _id: p._id, name: p.name, stock: p.stock, category: p.category });
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Stock In →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
