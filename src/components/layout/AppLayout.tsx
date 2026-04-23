import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleMenuToggle = () => {
    if (isMobile) setMobileOpen(o => !o);
    else setCollapsed(c => !c);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuToggle={handleMenuToggle} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
