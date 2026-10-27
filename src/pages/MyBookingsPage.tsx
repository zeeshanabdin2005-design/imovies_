import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, cancelBookingAtomic } from '../services/firebase';
import type { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Film,
  Sparkles
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Cancellation modal state
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    // Query only bookings where userId == user.uid (Zero-Trust Security requirement)
    const q = query(
      bookingsRef,
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        console.warn('My Bookings snapshot notice:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCancelBooking = async () => {
    if (!cancellingBookingId || !user) return;
    setCancelLoading(true);
    setCancelError(null);

    try {
      await cancelBookingAtomic(cancellingBookingId, user.uid, isAdmin);
      setCancellingBookingId(null);
    } catch (err: any) {
      console.error(err);
      setCancelError(err?.message || 'Failed to cancel reservation.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-full bg-[#171A23] border border-[#292D38] text-[#E5093F]">
          <Ticket className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white">Sign In to View Bookings</h2>
        <p className="text-xs text-[#A7A9B4] max-w-sm">
          Access your digital admission tickets, upcoming shows, and reservation history securely.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-2.5 rounded-full bg-[#E5093F] text-white text-xs font-bold hover:bg-[#FF3D61] transition-all"
        >
          Sign In / Guest Access
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter((b) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'cancelled') return b.status === 'cancelled';
    if (selectedTab === 'upcoming') {
      return b.status === 'confirmed' && b.showDate >= todayStr;
    }
    if (selectedTab === 'past') {
      return b.status === 'confirmed' && b.showDate < todayStr;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08090D] text-white py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#292D38]">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white">My Bookings</h1>
            <p className="text-xs text-[#A7A9B4]">
              Manage and view your cinema ticket reservations for Bhopal theatres.
            </p>
          </div>

          <Link
            to="/movies"
            className="px-5 py-2.5 rounded-full bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-bold shadow-lg shadow-[#E5093F]/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Film className="w-4 h-4" />
            <span>Book New Tickets</span>
          </Link>
        </div>

        {/* Tab filters */}
        <div className="flex bg-[#101219] border border-[#292D38] p-1.5 rounded-2xl max-w-md">
          {(['upcoming', 'past', 'cancelled', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                selectedTab === tab
                  ? 'bg-[#E5093F] text-white shadow-md'
                  : 'text-[#A7A9B4] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-[#E5093F] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="p-12 rounded-3xl bg-[#101219] border border-[#292D38] text-center space-y-4">
            <div className="p-4 rounded-full bg-[#171A23] border border-[#292D38] text-[#A7A9B4] w-14 h-14 mx-auto flex items-center justify-center">
              <Ticket className="w-7 h-7 text-[#E5093F]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No {selectedTab} bookings</h3>
              <p className="text-xs text-[#A7A9B4] max-w-sm mx-auto">
                {selectedTab === 'upcoming'
                  ? 'You have no upcoming movie shows booked. Explore currently running movies in Bhopal!'
                  : 'No tickets found in this category.'}
              </p>
            </div>
            <Link
              to="/movies"
              className="inline-block px-6 py-2.5 rounded-full bg-[#E5093F] text-white text-xs font-bold hover:bg-[#FF3D61]"
            >
              Discover Movies
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const isCancelled = b.status === 'cancelled';
              const isPast = b.showDate < todayStr;

              return (
                <div
                  key={b.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#101219] border border-[#292D38] hover:border-[#292D38]/80 transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left: Poster & Info */}
                  <div className="flex items-start sm:items-center gap-4">
                    <img
                      src={b.moviePoster}
                      alt={b.movieTitle}
                      className="w-16 h-24 object-cover rounded-xl border border-[#292D38] shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : isPast
                              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {b.status}
                        </span>
                        <span className="text-xs font-mono text-[#A7A9B4]">
                          Ref: {b.bookingReference}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white">
                        {b.movieTitle}
                      </h3>

                      <p className="text-xs text-[#A7A9B4] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E5093F]" />
                        <span>{b.cinemaName} • {b.screenName}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#A7A9B4]">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <Calendar className="w-3.5 h-3.5 text-[#E5093F]" />
                          {b.showDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-white">
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
                      <div className="text-[10px] text-[#A7A9B4] uppercase font-semibold">Total Paid</div>
                      <div className="text-lg font-black text-white">₹{b.totalAmount}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/booking/confirmation/${b.id}`, { state: { booking: b } })}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171A23] hover:bg-[#1E222E] border border-[#292D38] text-white text-xs font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#E5093F]" />
                        <span>Digital Pass</span>
                      </button>

                      {!isCancelled && !isPast && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingBookingId(b.id);
                            setCancelError(null);
                          }}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancellingBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-[#101219] border border-[#292D38] rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Cancel Booking?</h3>
              </div>

              <p className="text-xs text-[#A7A9B4] leading-relaxed">
                Cancelling this reservation will atomically release your seats in Cloud Firestore so other guests can book them.
              </p>

              {cancelError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={() => setCancellingBookingId(null)}
                  className="px-4 py-2 rounded-xl bg-[#171A23] text-white text-xs font-bold hover:bg-[#1E222E]"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={handleCancelBooking}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
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
