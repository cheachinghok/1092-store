import React, { useState } from 'react';

const PLACEHOLDER_BARS = [55, 80, 40, 95, 60, 75, 30, 85, 50, 70, 90, 45];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-300 mt-1">{value}</p>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const today = new Date().toISOString().split('T')[0];
  const [dailyDate, setDailyDate] = useState(today);
  const thisMonth = today.slice(0, 7);
  const [monthlyDate, setMonthlyDate] = useState(thisMonth);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* API banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
        Connect to <code className="bg-amber-100 px-1 rounded">/api/reports/daily</code> and <code className="bg-amber-100 px-1 rounded">/api/reports/monthly</code> to populate real data.
        All figures below are placeholders.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['daily', 'monthly'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 font-medium">{tab === 'daily' ? 'Date:' : 'Month:'}</label>
        {tab === 'daily' ? (
          <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        ) : (
          <input type="month" value={monthlyDate} onChange={e => setMonthlyDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value="$ —" />
        <StatCard label="Orders" value="—" />
        <StatCard label="Items Sold" value="—" />
        <StatCard label="Avg Sale" value="$ —" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">
          {tab === 'daily' ? 'Hourly Sales' : 'Daily Sales'}
          <span className="ml-2 text-xs text-gray-400 font-normal">(placeholder)</span>
        </h2>
        <div className="flex items-end gap-1.5 h-36">
          {PLACEHOLDER_BARS.map((h, i) => (
            <div key={i} className="flex-1 bg-indigo-100 hover:bg-indigo-200 rounded-t transition-colors" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          {tab === 'daily'
            ? ['12am','2am','4am','6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm'].map(l => <span key={l}>{l}</span>)
            : Array.from({ length: 12 }, (_, i) => <span key={i}>{i + 1}</span>)
          }
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Transactions</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Placeholder</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 font-medium">Order ID</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3].map(i => (
              <tr key={i}>
                <td className="px-5 py-3"><div className="h-3 bg-gray-100 rounded w-24" /></td>
                <td className="px-5 py-3"><div className="h-3 bg-gray-100 rounded w-16" /></td>
                <td className="px-5 py-3"><div className="h-3 bg-gray-100 rounded w-8" /></td>
                <td className="px-5 py-3"><div className="h-3 bg-gray-100 rounded w-20" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
