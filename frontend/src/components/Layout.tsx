import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import api from '../services/api';

interface SiteContent {
  page: string; title: string; subtitle: string; body: string;
  sections: { heading: string; content: string }[];
  meta: Record<string, string>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [shopName, setShopName] = useState('ElectriShop');
  const [footerSections, setFooterSections] = useState<{ heading: string; content: string }[]>([]);
  const [footerMeta, setFooterMeta] = useState<Record<string, string>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.get<SiteContent>('/site/settings').then((r) => { if (r.data.title) setShopName(r.data.title); }).catch(() => {});
    api.get<SiteContent>('/site/footer').then((r) => {
      if (r.data.sections) setFooterSections(r.data.sections);
      if (r.data.meta) setFooterMeta(r.data.meta);
    }).catch(() => {});
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const isHome = location.pathname === '/' || location.pathname === '/shop';
  const transparent = isHome && !scrolled;

  const navLinks = [
    { to: '/shop', label: 'Shop' },
    ...(user?.role !== 'Admin' ? [{ to: '/inquiry-list', label: 'Inquiry Cart' }] : []),
    ...(user ? [{ to: '/my-inquiries', label: 'My Inquiries' }] : []),
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    ...(user?.role === 'Admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md shadow-sm'
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt={shopName} className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 ${
                    isActive
                      ? 'text-charcoal after:w-full'
                      : 'text-soft hover:text-charcoal after:w-0'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm font-medium text-soft">
                  {user.displayName || user.email}
                </span>
                <button onClick={logout} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition">
                Sign in
              </Link>
            )}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-full text-charcoal transition">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className="block text-sm font-medium text-charcoal">
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold text-charcoal">{shopName}</h3>
              <p className="mt-3 text-sm text-soft leading-relaxed">Inquiry-first marketplace for quality electronics. Direct contact between buyers and sellers.</p>
            </div>
            {footerSections.map((section, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-charcoal uppercase tracking-wider">{section.heading}</h4>
                <p className="mt-3 text-sm text-soft leading-relaxed">{section.content}</p>
              </div>
            ))}
            {footerMeta.contact && (
              <div>
                <h4 className="text-sm font-semibold text-charcoal uppercase tracking-wider">Contact</h4>
                <p className="mt-3 text-sm text-soft">{footerMeta.contact}</p>
              </div>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-soft">
            <p>&copy; 2026 {shopName}. All rights reserved.</p>
            <p>Built for direct buyer-seller connections.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
