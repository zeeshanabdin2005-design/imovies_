import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#08090D] border-t border-[#292D38] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#292D38]">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E5093F] to-[#FF3D61] flex items-center justify-center text-white shadow-lg shadow-[#E5093F]/20">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-wider text-[#F5F5F7]">
                I<span className="text-[#E5093F]">MOVIES</span>
              </span>
            </Link>
            <p className="text-sm font-semibold text-[#F5F5F7] tracking-tight">
              "Your Next Movie Experience Starts Here."
            </p>
            <p className="text-xs text-[#A1A5B3] leading-relaxed max-w-sm">
              Discover blockbusters, explore auditorium showtimes, and reserve the best seats in the house with our premier cinema platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider mb-4 font-heading">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A1A5B3]">
              <li>
                <Link to="/" className="hover:text-[#F5F5F7] transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-[#F5F5F7] transition-colors">Now Showing</Link>
              </li>
              <li>
                <Link to="/cinemas" className="hover:text-[#F5F5F7] transition-colors">Cinemas & Multiplexes</Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-[#F5F5F7] transition-colors">My Bookings</Link>
              </li>
            </ul>
          </div>

          {/* Experience */}
          <div>
            <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider mb-4 font-heading">
              Cinema Experience
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A1A5B3]">
              <li>Dolby Atmos 3D Audio</li>
              <li>4K Laser Projection</li>
              <li>Plush VIP Recliners</li>
              <li>Zero-Wait Mobile Admission</li>
            </ul>
          </div>

          {/* Authentication & Account */}
          <div>
            <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider mb-4 font-heading">
              Account & Support
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A1A5B3]">
              <li>
                <Link to="/login" className="hover:text-[#F5F5F7] transition-colors">Sign In</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#F5F5F7] transition-colors">Create Account</Link>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Encrypted & Verified</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A1A5B3]">
          <div>
            © {new Date().getFullYear()} IMovies Entertainment Inc. All rights reserved. Demonstration Cinema Platform.
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted for cinema lovers</span>
            <Heart className="w-3.5 h-3.5 text-[#E5093F] fill-[#E5093F]" />
          </div>
        </div>
      </div>
    </footer>
  );
};
