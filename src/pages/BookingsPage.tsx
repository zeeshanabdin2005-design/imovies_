import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Film,
  Eye,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState } from '../components/EmptyState';
import { fetchUserBookings, cancelBooking } from '../services/movieApi';
import { useAuth } from '../context/AuthContext';
import type { Booking } from '../types';

export const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setCancelSuccessMsg(null);
    const effectiveUserId =
      user?.uid || localStorage.getItem('imovies_demo_guest_id') || 'guest_demo_user';
    const guestEmail = localStorage.getItem('imovies_demo_guest_email') || user?.email || undefined;

    try {
      // 1. Fetch from server with scoped userId and/or email
      const serverBookings = await fetchUserBookings({
        userId: effectiveUserId,
        email: guestEmail
      }).catch(() => []);

      // 2. Fetch local storage cached bookings
      let localBookings: Booking[] = [];
      try {
        localBookings = JSON.parse(localStorage.getItem('imovies_user_bookings') || '[]');
      } catch {}

      // Deduplicate by ID
      const map = new Map<string, Booking>();
      serverBookings.forEach((b) => map.set(b.id, b));
      localBookings.forEach((b) => {
        if (!map.has(b.id)) map.set(b.id, b);
      });

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBookings(combined);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await cancelBooking(cancellingBooking.id);
      if (!res.success) {
        setCancelError(res.message || 'Failed to cancel reservation.');
        setCancelLoading(false);
        return;
      }

      // Update state
      setBookings((prev) =>
        prev.map((b) => (b.id === cancellingBooking.id ? { ...b, status: 'cancelled' } : b))
      );

      // Update localStorage
      try {
        const localList: Booking[] = JSON.parse(
          localStorage.getItem('imovies_user_bookings') || '[]'
        );
        const updated = localList.map((b) =>
          b.id === cancellingBooking.id ? { ...b, status: 'cancelled' as const } : b
        );
        localStorage.setItem('imovies_user_bookings', JSON.stringify(updated));
      } catch {}

      setCancelSuccessMsg(res.message || `Booking ${cancellingBooking.bookingReference} cancelled successfully.`);
      setCancellingBooking(null);
    } catch (err: any) {
      setCancelError(err?.message || 'Error occurred while cancelling.');
    } finally {
      setCancelLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter((b) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'cancelled') return b.status === 'cancelled';
    if (selectedTab === 'upcoming') {
      return b.status === 'confirmed' && b.showDate >= todayStr;
    }
    if (selectedTab === 'past') {
      return (b.status === 'confirmed' && b.showDate < todayStr) || b.status === 'payment_failed';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F5F7] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#292D38]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-[#F5F5F7] font-heading">My Bookings</h1>
              <button
                type="button"
                onClick={loadBookings}
                title="Refresh Bookings"
                className="p-1 rounded-lg text-[#A1A5B3] hover:text-white hover:bg-[#171A23] transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#A1A5B3]">
              View your cinema admissions, seat allocations, payment statuses, and digital passes.
            </p>
          </div>

          <PrimaryButton to="/movies" size="sm" icon={<Film className="w-4 h-4" />}>
            Book New Tickets
          </PrimaryButton>
        </div>

        {/* Success Alert */}
        {cancelSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{cancelSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setCancelSuccessMsg(null)}
              className="text-xs text-emerald-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-[#101219] border border-[#292D38] p-1.5 rounded-2xl max-w-md">
          {(['upcoming', 'past', 'cancelled', 'all'] as const).map((tab) => {
            const count = bookings.filter((b) => {
              if (tab === 'all') return true;
              if (tab === 'cancelled') return b.status === 'cancelled';
              if (tab === 'upcoming') return b.status === 'confirmed' && b.showDate >= todayStr;
              if (tab === 'past') return (b.status === 'confirmed' && b.showDate < todayStr) || b.status === 'payment_failed';
              return true;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedTab === tab
                    ? 'bg-[#E5093F] text-white shadow-md'
                    : 'text-[#A1A5B3] hover:text-[#F5F5F7]'
                }`}
              >
                <span>{tab}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#E5093F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#A1A5B3]">Retrieving your reserved cinema tickets...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredBookings.length === 0 && (
          <EmptyState
            title={`No ${selectedTab} bookings found`}
            message={
              selectedTab === 'upcoming'
                ? 'You have no active cinema reservations scheduled. Select a Bhopal cinema screening to book tickets.'
                : 'No movie ticket passes found in this category.'
            }
            actionText="Explore Movies"
            actionTo="/movies"
          />
        )}

        {/* Bookings List */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const isCancelled = b.status === 'cancelled';
              const isFailed = b.status === 'payment_failed';
              const isConfirmed = b.status === 'confirmed';
              const isPast = b.showDate < todayStr;

              return (
                <div
                  key={b.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#101219] border border-[#292D38] hover:border-[#383C4A] transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left Poster & Details */}
                  <div className="flex items-start sm:items-center gap-4">
                    <img
                      src={b.moviePoster}
                      alt={b.movieTitle}
                      className="w-16 h-24 object-cover rounded-xl border border-[#292D38] shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {isConfirmed && !isPast && (
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Confirmed
                          </span>
                        )}
                        {isConfirmed && isPast && (
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/40">
                            Completed Show
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/40">
                            Cancelled
                          </span>
                        )}
                        {isFailed && (
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            Payment Failed
                          </span>
                        )}

                        <span className="text-xs font-mono font-bold text-[#E5093F] bg-[#E5093F]/10 px-2 py-0.5 rounded border border-[#E5093F]/20">
                          Ref: {b.bookingReference}
                        </span>

                        <span className="text-[11px] text-[#A1A5B3]">
                          {b.paymentStatus === 'demo_verified' ? '• Demo Verified' : '• Demo Simulator'}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-[#F5F5F7] font-heading">
                        {b.movieTitle}
                      </h3>

                      <p className="text-xs text-[#A1A5B3] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E5093F]" />
                        <span>{b.cinemaName} • {b.screenName}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#A1A5B3]">
                        <span className="flex items-center gap-1 font-semibold text-[#F5F5F7]">
                          <Calendar className="w-3.5 h-3.5 text-[#E5093F]" />
                          {b.showDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-[#F5F5F7]">
                          <Clock className="w-3.5 h-3.5 text-[#E5093F]" />
                          {b.showTime}
                        </span>
                        <span>•</span>
                        <span className="text-[#FF3D61] font-bold">
                          Seats ({b.seats.length}): {b.seats.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-[#292D38] gap-3">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-[#A1A5B3] uppercase font-semibold">
                        {isFailed ? 'Simulated Total' : 'Total Amount'}
                      </div>
                      <div className="text-xl font-black text-[#F5F5F7]">₹{b.totalAmount}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => navigate(`/booking/${b.id}`, { state: { booking: b } })}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171A23] hover:bg-[#1E222E] border border-[#292D38] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#E5093F]" />
                          <span>Digital Pass</span>
                        </button>
                      )}

                      {isConfirmed && !isPast && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingBooking(b);
                            setCancelError(null);
                          }}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {isFailed && (
                        <Link
                          to={`/checkout?showId=${b.showId}&seats=${b.seats.join(',')}`}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-bold transition-all shadow-md"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry Checkout</span>
                        </Link>
                      )}

                      {isCancelled && (
                        <Link
                          to={`/shows/${b.showId}/seats`}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#171A23] hover:bg-[#1E222E] border border-[#292D38] text-[#A1A5B3] hover:text-white text-xs font-bold transition-all"
                        >
                          <Film className="w-3.5 h-3.5 text-[#E5093F]" />
                          <span>Book Again</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-[#101219] border border-[#292D38] rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white font-heading">Cancel Reservation?</h3>
              </div>

              <div className="space-y-2 text-xs text-[#A1A5B3] leading-relaxed">
                <p>
                  Are you sure you want to cancel booking <strong className="text-white font-mono">{cancellingBooking.bookingReference}</strong> for <strong className="text-white">{cancellingBooking.movieTitle}</strong>?
                </p>
                <div className="p-3 rounded-xl bg-[#171A23] border border-[#292D38] text-white">
                  <div>Seats to be released: <span className="font-mono text-[#FF3D61] font-bold">{cancellingBooking.seats.join(', ')}</span></div>
                  <div className="text-[11px] text-[#A1A5B3] mt-0.5">Show: {cancellingBooking.showDate} at {cancellingBooking.showTime}</div>
                </div>
                <p className="text-amber-300">
                  Notice: These seats will be atomically released back into the Bhopal auditorium pool for other moviegoers.
                </p>
              </div>

              {cancelError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={() => setCancellingBooking(null)}
                  className="px-4 py-2 rounded-xl bg-[#171A23] text-white text-xs font-bold hover:bg-[#1E222E] cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={handleCancelBooking}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {cancelLoading ? 'Releasing Seats...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
