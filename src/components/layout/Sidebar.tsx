import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'POS', icon: ShoppingBagIcon, exact: true },
  { to: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { to: '/products', label: 'Products', icon: CubeIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
  { to: '/inventory', label: 'Inventory', icon: ClipboardDocumentListIcon },
  { to: '/reports', label: 'Reports', icon: DocumentChartBarIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export default function Sidebar({ collapsed, onToggle, isMobile, mobileOpen, onMobileClose }: SidebarProps) {
  const showLabels = isMobile || !collapsed;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30" onClick={onMobileClose} />
      )}

      <aside
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-800 text-white w-[240px] transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `relative flex flex-col bg-slate-800 text-white transition-all duration-200 shrink-0 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`
        }
      >
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-slate-700 ${showLabels ? 'gap-3' : 'justify-center'}`}>
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <ShoppingBagIcon className="w-5 h-5 text-white" />
          </div>
          {showLabels && <span className="font-bold text-base tracking-wide">1092 POS</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={isMobile ? onMobileClose : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                } ${showLabels ? '' : 'justify-center'}`
              }
              title={!showLabels ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {showLabels && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-3 py-3 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : (
              <>
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </aside>
    </>
  );
}
