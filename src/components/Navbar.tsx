import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Menu, X, Ticket, User, Search } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, isAdmin, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#08090D]/90 backdrop-blur-md border-b border-[#292D38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Desktop Links */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E5093F] to-[#FF3D61] flex items-center justify-center text-white shadow-lg shadow-[#E5093F]/30 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-wider text-[#F5F5F7]">
                  I<span className="text-[#E5093F]">MOVIES</span>
                </span>
                <span className="text-[10px] text-[#A1A5B3] tracking-widest uppercase font-semibold -mt-1 font-sans">
                  Cinematic Luxe
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                to="/"
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/')
                    ? 'text-[#E5093F] bg-[#171A23]'
                    : 'text-[#A1A5B3] hover:text-[#F5F5F7] hover:bg-[#171A23]/60'
                }`}
              >
                Home
              </Link>
              <Link
                to="/movies"
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/movies')
                    ? 'text-[#E5093F] bg-[#171A23]'
                    : 'text-[#A1A5B3] hover:text-[#F5F5F7] hover:bg-[#171A23]/60'
                }`}
              >
                Movies
              </Link>
              <Link
                to="/cinemas"
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/cinemas')
                    ? 'text-[#E5093F] bg-[#171A23]'
                    : 'text-[#A1A5B3] hover:text-[#F5F5F7] hover:bg-[#171A23]/60'
                }`}
              >
                Cinemas
              </Link>
              <Link
                to="/bookings"
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/bookings')
                    ? 'text-[#E5093F] bg-[#171A23]'
                    : 'text-[#A1A5B3] hover:text-[#F5F5F7] hover:bg-[#171A23]/60'
                }`}
              >
                My Bookings
              </Link>
            </div>
          </div>

          {/* Right Actions: Search + Sign In */}
          <div className="hidden lg:flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B3]" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#171A23] border border-[#292D38] focus:border-[#E5093F] rounded-full pl-9 pr-4 py-2 text-xs text-[#F5F5F7] placeholder-[#A1A5B3] outline-none transition-all"
              />
            </form>

            {isAdmin && <Link to="/admin" className="px-3 py-2 rounded-full border border-amber-500/40 text-amber-300 text-xs font-bold">Admin</Link>}
            {user ? (
              <button onClick={async () => { await logout(); navigate('/'); }} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#171A23] hover:bg-[#292D38] border border-[#292D38] text-[#F5F5F7] text-xs font-bold">
                <User className="w-4 h-4" /><span>{userProfile?.displayName || (user.isAnonymous ? 'Guest' : 'Account')} · Sign Out</span>
              </button>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E5093F] hover:bg-[#FF3D61] text-[#F5F5F7] text-xs font-bold shadow-lg shadow-[#E5093F]/25 transition-all hover:scale-105 active:scale-95">
                <User className="w-4 h-4" /><span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-[#171A23] text-[#F5F5F7] border border-[#292D38] hover:border-[#E5093F] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#101219] border-b border-[#292D38] px-4 pt-3 pb-6 space-y-4 animate-in fade-in duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B3]" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F5F5F7] placeholder-[#A1A5B3] outline-none focus:border-[#E5093F]"
            />
          </form>

          <div className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/') ? 'text-[#E5093F] bg-[#171A23]' : 'text-[#A1A5B3] hover:text-[#F5F5F7]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/movies"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/movies') ? 'text-[#E5093F] bg-[#171A23]' : 'text-[#A1A5B3] hover:text-[#F5F5F7]'
              }`}
            >
              Movies
            </Link>
            <Link
              to="/cinemas"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/cinemas') ? 'text-[#E5093F] bg-[#171A23]' : 'text-[#A1A5B3] hover:text-[#F5F5F7]'
              }`}
            >
              Cinemas
            </Link>
            <Link
              to="/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/bookings') ? 'text-[#E5093F] bg-[#171A23]' : 'text-[#A1A5B3] hover:text-[#F5F5F7]'
              }`}
            >
              My Bookings
            </Link>
          </div>

          <div className="pt-3 border-t border-[#292D38] flex items-center justify-between">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 rounded-xl bg-[#E5093F] text-[#F5F5F7] text-xs font-bold"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
