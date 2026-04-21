import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../lib/utils';

interface ReportDay {
  date: string;
  profit: number;
  revenue: number;
  cost: number;
  orders: number;
}

interface Summary {
  totalProfit: number;
  totalRevenue: number;
  totalCost: number;
  totalOrders: number;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0].slice(0, 7);

  const [dailyStart, setDailyStart] = useState(thirtyDaysAgo);
  const [dailyEnd, setDailyEnd] = useState(today);
  const [monthlyStart, setMonthlyStart] = useState(sixMonthsAgo);
  const [monthlyEnd, setMonthlyEnd] = useState(thisMonth);

  const [data, setData] = useState<ReportDay[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ period: tab });
      if (tab === 'daily') {
        params.set('startDate', dailyStart);
        params.set('endDate', dailyEnd);
      } else {
        params.set('startDate', `${monthlyStart}-01`);
        params.set('endDate', `${monthlyEnd}-31`);
      }
      const res = await fetch(`${API_BASE}/api/orders/report?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        setSummary(d.summary);
        setData(d.data);
      } else {
        setError(d.message || 'Failed to load report');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [tab, dailyStart, dailyEnd, monthlyStart, monthlyEnd]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.revenue)) : 1;

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const formatLabel = (dateStr: string) => {
    if (tab === 'monthly') return dateStr.slice(0, 7);
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['daily', 'monthly'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">From:</span>
        {tab === 'daily' ? (
          <>
            <input type="date" value={dailyStart} onChange={e => setDailyStart(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-sm text-gray-400">to</span>
            <input type="date" value={dailyEnd} onChange={e => setDailyEnd(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </>
        ) : (
          <>
            <input type="month" value={monthlyStart} onChange={e => setMonthlyStart(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-sm text-gray-400">to</span>
            <input type="month" value={monthlyEnd} onChange={e => setMonthlyEnd(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={loading ? '…' : summary ? fmt(summary.totalRevenue) : '—'} color="text-blue-600" />
        <StatCard label="Profit" value={loading ? '…' : summary ? fmt(summary.totalProfit) : '—'} color="text-emerald-600" />
        <StatCard label="Cost" value={loading ? '…' : summary ? fmt(summary.totalCost) : '—'} color="text-red-500" />
        <StatCard label="Orders" value={loading ? '…' : summary ? String(summary.totalOrders) : '—'} color="text-indigo-600" />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">
          Revenue by {tab === 'daily' ? 'Day' : 'Month'}
        </h2>
        {loading ? (
          <div className="h-36 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : data.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-gray-400 text-sm">No orders in this period</div>
        ) : (
          <>
            <div className="flex items-end gap-1 h-36 overflow-x-auto pb-1">
              {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: data.length > 20 ? '12px' : '24px' }}>
                  <div
                    className="w-full bg-indigo-400 hover:bg-indigo-600 rounded-t transition-colors cursor-default"
                    style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 2)}%` }}
                    title={`${formatLabel(d.date)}: ${fmt(d.revenue)} revenue, ${fmt(d.profit)} profit, ${d.orders} orders`}
                  />
                </div>
              ))}
            </div>
            {/* Labels — only show a few to avoid crowding */}
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{formatLabel(data[0].date)}</span>
              {data.length > 2 && <span>{formatLabel(data[Math.floor(data.length / 2)].date)}</span>}
              <span>{formatLabel(data[data.length - 1].date)}</span>
            </div>
          </>
        )}
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{tab === 'daily' ? 'Daily' : 'Monthly'} Breakdown</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No data for this period</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">{tab === 'daily' ? 'Date' : 'Month'}</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Cost</th>
                <th className="px-5 py-3 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{formatLabel(row.date)}</td>
                  <td className="px-5 py-3 text-gray-600">{row.orders}</td>
                  <td className="px-5 py-3 text-blue-600 font-medium">{fmt(row.revenue)}</td>
                  <td className="px-5 py-3 text-red-500">{fmt(row.cost)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(row.profit)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
