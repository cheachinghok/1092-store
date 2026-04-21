import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/utils';

interface Product {
  _id: string;
  name: string;
  stock: number;
  category: string;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lowStock = products.filter(p => p.stock <= 10);

  const statCards = [
    { label: "Today's Revenue", value: '$ —', sub: 'UI Only', color: 'text-indigo-600' },
    { label: 'Transactions', value: '—', sub: 'UI Only', color: 'text-blue-600' },
    { label: 'Items Sold', value: '—', sub: 'UI Only', color: 'text-purple-600' },
    { label: 'Low Stock Items', value: loading ? '…' : String(lowStock.length), sub: 'Live', color: lowStock.length > 0 ? 'text-red-600' : 'text-emerald-600' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Low Stock Alerts</h2>
          <p className="text-xs text-gray-400 mt-0.5">Products with stock ≤ 10</p>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
        ) : lowStock.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">All products are well-stocked</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lowStock.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-3 text-gray-500">{p.category}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/inventory?tab=stock-in&product=${p._id}`)}
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

      {/* Recent Transactions placeholder */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">UI Only</span>
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-5 py-3 flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-2.5 bg-gray-50 rounded w-1/4" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Sales chart placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Today's Sales</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">UI Only — connect to /api/reports/daily</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50].map((h, i) => (
            <div key={i} className="flex-1 bg-indigo-100 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>Now</span>
        </div>
      </div>
    </div>
  );
}
