import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/utils';

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, []);
  return <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm bg-emerald-600">{message}</div>;
}

export default function Settings() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState(() => localStorage.getItem('storeName') || '1092 POS');
  const [threshold, setThreshold] = useState(() => localStorage.getItem('lowStockThreshold') || '10');
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.user); })
      .catch(() => {});
  }, []);

  const saveSettings = () => {
    localStorage.setItem('storeName', storeName);
    localStorage.setItem('lowStockThreshold', threshold);
    setToast('Settings saved');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Store Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800">Store</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
          <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <input type="text" value="USD & KHR (Cambodian Riel)" disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
          <p className="text-xs text-gray-400 mb-2">Products at or below this quantity show as low stock</p>
          <input type="number" min="1" value={threshold} onChange={e => setThreshold(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <button onClick={saveSettings}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors">
          Save Settings
        </button>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Account</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">
            {(user?.name || user?.email || 'C')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user?.name || 'Cashier'}</p>
            <p className="text-sm text-gray-400">{user?.email || '—'}</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">Logout</h2>
        <p className="text-sm text-gray-400 mb-4">This will clear your session and return to the login page.</p>
        <button onClick={() => setShowLogout(true)}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors">
          Logout Now
        </button>
      </div>

      {/* Logout confirm */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Log out?</h3>
            <p className="text-sm text-gray-500 mb-6">Any unsaved cart items will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleLogout} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
