import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { API_BASE } from '../lib/utils';

interface Product {
  id: string;
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
}

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {message}
    </div>
  );
}

export default function POSScreen() {
  const { items, addItem, removeItem, updateQty, updatePrice, clearCart, total, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [cashInput, setCashInput] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState('');
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'All') params.set('category', category);
    try {
      const res = await fetch(`${API_BASE}/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map((p: any) => ({
          id: p._id, _id: p._id, name: p.name, price: p.sellingPrice,
          category: p.category, image: p.images?.[0] || '', description: p.description, stock: p.stock ?? 0,
        }));
        setProducts(mapped);
        const cats = ['All', ...Array.from(new Set(mapped.map((p: Product) => p.category))) as string[]];
        setCategories(cats);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const cash = parseFloat(cashInput) || 0;
  const change = cash - total;

  const handleCharge = async () => {
    if (items.length === 0 || cash < total) return;
    setCharging(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ product: i._id, quantity: i.quantity })),
          paymentMethod: 'cash_on_delivery',
          shippingAddress: {
            fullName: 'In-Store Customer',
            address: 'In-Store',
            city: 'In-Store',
            postalCode: '00000',
            country: 'Cambodia',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: `Charged $${total.toFixed(2)} — Change $${change.toFixed(2)}`, type: 'success' });
        clearCart();
        setCashInput('');
      } else {
        setToast({ message: data.message || 'Order failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' });
    } finally { setCharging(false); }
  };

  const startEditPrice = (id: string, currentPrice: number) => {
    setEditingPriceId(id);
    setEditingPriceVal(String(currentPrice));
  };

  const commitEditPrice = (id: string) => {
    const val = parseFloat(editingPriceVal);
    if (!isNaN(val) && val > 0) updatePrice(id, val);
    setEditingPriceId(null);
  };

  return (
    <div className="flex h-full">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* LEFT — Product Panel */}
      <div className="flex flex-col flex-1 min-w-0 p-4 gap-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search or scan barcode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* Category tiles */}
        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No products found</div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 content-start">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => addItem({ id: p.id, _id: p._id, name: p.name, price: p.price, image: p.image, category: p.category })}
                className="bg-white rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all text-left overflow-hidden group"
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-xs">No image</div>
                )}
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-sm font-bold text-indigo-700 mt-1">${p.price.toFixed(2)}</p>
                  {p.stock <= 10 && p.stock > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">Only {p.stock} left</p>
                  )}
                  {p.stock === 0 && (
                    <p className="text-xs text-red-500 mt-0.5">Out of stock</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Cart Panel */}
      <div className="w-[380px] shrink-0 border-l border-gray-200 bg-white flex flex-col">
        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-800">CART <span className="text-indigo-600">({itemCount})</span></span>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All</button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Cart is empty</div>
          ) : items.map(item => {
            const effectivePrice = item.customPrice ?? item.price;
            const priceEdited = item.customPrice !== undefined && item.customPrice !== item.price;
            return (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 flex-1 leading-tight">{item.name}</span>
                  <button onClick={() => removeItem(item.id)} className="shrink-0 text-gray-400 hover:text-red-500">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {/* Qty */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm font-bold">−</button>
                    <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm font-bold">+</button>
                  </div>

                  {/* Price */}
                  {editingPriceId === item.id ? (
                    <input
                      type="number"
                      value={editingPriceVal}
                      onChange={e => setEditingPriceVal(e.target.value)}
                      onBlur={() => commitEditPrice(item.id)}
                      onKeyDown={e => e.key === 'Enter' && commitEditPrice(item.id)}
                      className="w-20 px-2 py-1 border-2 border-amber-400 rounded-lg text-sm text-center focus:outline-none bg-amber-50"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => startEditPrice(item.id, effectivePrice)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors ${priceEdited ? 'text-amber-600 bg-amber-50' : 'text-gray-700 hover:bg-gray-100'}`}
                      title={priceEdited ? `Original: $${item.price.toFixed(2)}` : 'Edit price'}
                    >
                      ${effectivePrice.toFixed(2)}
                      <PencilIcon className="w-3 h-3" />
                    </button>
                  )}

                  <span className="ml-auto text-sm font-semibold text-gray-900">
                    ${(effectivePrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">TOTAL</span>
            <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Cash / Change */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 shrink-0">Cash:</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={cashInput}
                onChange={e => setCashInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick cash chips */}
          <div className="flex gap-2 flex-wrap">
            {[20, 50, 100, 500].map(n => (
              <button
                key={n}
                onClick={() => setCashInput(v => String((parseFloat(v) || 0) + n))}
                className="px-3 py-1 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-xs font-medium rounded-full transition-colors"
              >
                +{n}
              </button>
            ))}
            {total > 0 && (
              <button
                onClick={() => setCashInput(String(Math.ceil(total / 10) * 10))}
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full transition-colors"
              >
                Exact
              </button>
            )}
          </div>

          {/* Change */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Change:</span>
            <span className={`text-base font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {cashInput === '' ? '—' : change >= 0 ? `$${change.toFixed(2)}` : 'Need more'}
            </span>
          </div>
        </div>

        {/* Charge button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleCharge}
            disabled={items.length === 0 || cash < total || charging}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-colors"
          >
            {charging ? 'Processing…' : `CHARGE  $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
