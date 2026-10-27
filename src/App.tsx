/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { CinemasPage } from './pages/CinemasPage';
import { BookingsPage } from './pages/BookingsPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TicketConfirmationPage } from './pages/TicketConfirmationPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#08090D] text-white flex items-center justify-center">Checking administrator access…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <div className="min-h-screen bg-[#08090D] text-white flex flex-col items-center justify-center p-8 text-center"><h1 className="text-2xl font-black">Administrator access required</h1><p className="mt-3 text-sm text-[#A7A9B4]">Sign in with the authorized, verified administrator account.</p></div>;
  return <AdminDashboardPage />;
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#08090D] text-[#F5F5F7] selection:bg-[#E5093F] selection:text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movies/:id" element={<MovieDetailsPage />} />
            <Route path="/movie/:imdbId" element={<MovieDetailsPage />} />
            <Route path="/shows/:showId/seats" element={<SeatSelectionPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/booking/:bookingId" element={<TicketConfirmationPage />} />
            <Route path="/booking/confirmation/:bookingId" element={<TicketConfirmationPage />} />
            <Route path="/cinemas" element={<CinemasPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/my-bookings" element={<BookingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
    </AuthProvider>
  );
}
