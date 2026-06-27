import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === '/' && path === '/') return true;
    if (route !== '/' && path.startsWith(route)) return true;
    return false;
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Inspect', path: '/inspect' },
    { label: 'Archive', path: '/history' },
    { label: 'Spreadsheet', path: '/bulk' },
    { label: 'Specs', path: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-page border-b border-border-card z-50 px-8 flex items-center justify-between">
      {/* Brand logo - very minimal */}
      <Link to="/" className="flex items-center gap-2 group">
        <Shield className="w-4 h-4 text-text-primary" />
        <span className="font-mono text-sm font-semibold tracking-tight text-text-primary">
          phish_garud
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex gap-6 items-center">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`text-xs font-mono transition-colors duration-200 ${
                active
                  ? 'text-text-primary underline underline-offset-4'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Muted tiny live status indicator */}
        <span className="text-[10px] font-mono text-safe-green bg-safe-green/10 border border-safe-green/20 px-2 py-0.5 rounded uppercase tracking-wider">
          online
        </span>
      </div>
    </nav>
  );
};
