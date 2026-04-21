import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/utils';

interface ReportDay {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface Product {
  _id: string;
  name: string;
  stock: number;
  category: string;
}

interface TodaySummary {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [chartData, setChartData] = useState<ReportDay[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const today = new Date().toISOString().split('T')[0];

    fetch(`${API_BASE}/api/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API_BASE}/api/orders/report?period=daily&startDate=${today}&endDate=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setTodaySummary(d.summary); })
      .catch(() => {});

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    fetch(`${API_BASE}/api/orders/report?period=daily&startDate=${sevenDaysAgo}&endDate=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setChartData(d.data); })
      .catch(() => {});
  }, []);

  const lowStock = products.filter(p => p.stock <= 10);
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const statCards = [
    { label: "Today's Revenue", value: todaySummary ? fmt(todaySummary.totalRevenue) : '…', sub: 'Live', color: 'text-indigo-600' },
    { label: "Today's Profit", value: todaySummary ? fmt(todaySummary.totalProfit) : '…', sub: 'Live', color: 'text-emerald-600' },
    { label: "Today's Orders", value: todaySummary ? String(todaySummary.totalOrders) : '…', sub: 'Live', color: 'text-blue-600' },
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

      {/* Sales chart — last 7 days */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Revenue — Last 7 Days</h2>
        {chartData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No orders in the last 7 days</div>
        ) : (
          <>
            <div className="flex items-end gap-2 h-32">
              {chartData.map((d, i) => {
                const maxRev = Math.max(...chartData.map(x => x.revenue), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-indigo-400 hover:bg-indigo-600 rounded-t transition-colors cursor-default"
                      style={{ height: `${Math.max((d.revenue / maxRev) * 100, 4)}%` }}
                      title={`${d.date}: $${d.revenue.toFixed(2)} revenue`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              {chartData.map((d, i) => (
                <span key={i}>{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
