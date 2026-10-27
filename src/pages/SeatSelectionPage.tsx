import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Show, SeatCategory, Booking } from '../types';
import { fetchShowDetails, calculateBookingPrice, reserveSeats } from '../services/movieApi';
import { useAuth } from '../context/AuthContext';
import {
  Film,
  Calendar,
  Clock,
  MapPin,
  Check,
  AlertCircle,
  Tag,
  ShieldCheck,
  ArrowRight,
  Info,
  User,
  Mail,
  RefreshCw
} from 'lucide-react';

const ROWS = ['J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']; // Top (recliners) to bottom (screen)
const COLS = 12;

export const SeatSelectionPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected seats state
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Checkout modal & coupon state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Guest details state (no forced login required)
  const [guestName, setGuestName] = useState(() => {
    return user?.displayName || localStorage.getItem('imovies_demo_guest_name') || 'Guest Explorer';
  });
  const [guestEmail, setGuestEmail] = useState(() => {
    return user?.email || localStorage.getItem('imovies_demo_guest_email') || 'guest@imovies.demo';
  });

  // Booking processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [collisionAlert, setCollisionAlert] = useState<string | null>(null);

  // Fetch show details
  const loadShow = async (silent = false) => {
    if (!showId) return;
    if (!silent) setLoading(true);
    try {
      const data = await fetchShowDetails(showId);
      setShow(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load show:', err);
      if (!silent) setError(err.message || 'Showtime record could not be loaded.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadShow();
  }, [showId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#E5093F] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[#A7A9B4]">Preparing interactive Bhopal auditorium layout...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 rounded-full bg-red-500/10 text-red-400">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white">Showtime Not Available</h2>
        <p className="text-xs text-[#A7A9B4] max-w-sm">
          {error || 'Unable to locate the selected show.'}
        </p>
        <Link
          to="/movies"
          className="px-6 py-2.5 rounded-full bg-[#E5093F] text-white text-xs font-bold hover:bg-[#FF3D61]"
        >
          Explore Other Movies
        </Link>
      </div>
    );
  }

  const bookedSet = new Set(show.bookedSeats || []);

  const getSeatCategory = (row: string): SeatCategory => {
    if (['I', 'J'].includes(row)) return 'recliner';
    if (['F', 'G', 'H'].includes(row)) return 'premium';
    return 'regular';
  };

  const getSeatPrice = (row: string): number => {
    const cat = getSeatCategory(row);
    if (cat === 'recliner') return show.pricing?.recliner || 480;
    if (cat === 'premium') return show.pricing?.premium || 320;
    return show.pricing?.regular || 200;
  };

  const toggleSeat = (seatId: string) => {
    if (bookedSet.has(seatId)) return;
    setCollisionAlert(null);

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId);
      }
      if (prev.length >= 8) {
        alert('You can reserve up to 8 tickets per booking.');
        return prev;
      }
      return [...prev, seatId];
    });
  };

  // Price calculations
  let subtotal = 0;
  selectedSeats.forEach((seatId) => {
    const row = seatId.charAt(0);
    subtotal += getSeatPrice(row);
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();

    if (code === 'IMOVIES50') {
      const disc = Math.min(Math.round(subtotal * 0.5), 300);
      setCouponDiscount(disc);
      setAppliedCoupon('IMOVIES50');
    } else if (code === 'FIRSTSHOW') {
      const disc = Math.min(100, subtotal);
      setCouponDiscount(disc);
      setAppliedCoupon('FIRSTSHOW');
    } else if (code === 'WEEKEND20') {
      const disc = Math.round(subtotal * 0.2);
      setCouponDiscount(disc);
      setAppliedCoupon('WEEKEND20');
    } else {
      setCouponError('Invalid coupon code. Try IMOVIES50, FIRSTSHOW, or WEEKEND20.');
    }
  };

  const convenienceFee = selectedSeats.length > 0 ? selectedSeats.length * 35 : 0;
  const taxableAmount = Math.max(0, subtotal - couponDiscount + convenienceFee);
  const taxes = Math.round(taxableAmount * 0.18);
  const totalAmount = Math.max(0, taxableAmount + taxes);

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) return;
    setCollisionAlert(null);
    navigate(`/checkout?showId=${show.id}&seats=${selectedSeats.join(',')}`, {
      state: {
        showId: show.id,
        seats: selectedSeats,
        show
      }
    });
  };

  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    setCollisionAlert(null);

    // Persist guest details for convenience
    localStorage.setItem('imovies_demo_guest_name', guestName);
    localStorage.setItem('imovies_demo_guest_email', guestEmail);

    // Get or create guest user ID
    let currentUserId = user?.uid;
    if (!currentUserId) {
      let storedGuestId = localStorage.getItem('imovies_demo_guest_id');
      if (!storedGuestId) {
        storedGuestId = `guest_${Date.now()}`;
        localStorage.setItem('imovies_demo_guest_id', storedGuestId);
      }
      currentUserId = storedGuestId;
    }

    try {
      const res = await reserveSeats({
        showId: show.id,
        seats: selectedSeats,
        userId: currentUserId,
        userName: guestName || 'Guest Explorer',
        userEmail: guestEmail || 'guest@imovies.demo',
        couponCode: appliedCoupon || undefined
      });

      if (!res.success) {
        if (res.conflict) {
          // HTTP 409 Seat collision detected
          setCollisionAlert(res.message);
          // Refresh show details silently to show newly booked seats
          await loadShow(true);
          // Filter out conflicting seats from selection
          if (res.conflictingSeats && res.conflictingSeats.length > 0) {
            const conflictSet = new Set(res.conflictingSeats);
            setSelectedSeats((prev) => prev.filter((s) => !conflictSet.has(s)));
          }
          setCheckoutModalOpen(false);
        } else {
          setCollisionAlert(res.message || 'Unable to reserve seats. Please retry.');
        }
        setIsProcessing(false);
        return;
      }

      // Successful reservation
      if (res.booking) {
        // Save to local guest booking list
        const localList = JSON.parse(localStorage.getItem('imovies_user_bookings') || '[]');
        localList.unshift(res.booking);
        localStorage.setItem('imovies_user_bookings', JSON.stringify(localList));

        // Navigate to digital ticket confirmation pass
        navigate(`/booking/${res.booking.id}`, { state: { booking: res.booking } });
      }
    } catch (err: any) {
      console.error('Reservation error:', err);
      setCollisionAlert(err.message || 'An unexpected connection error occurred.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-white py-8 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#292D38]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                to={`/movies/${show.movieImdbId}`}
                className="text-xs font-bold text-[#E5093F] hover:underline"
              >
                ← Back to Movie
              </Link>
              <span className="text-xs text-[#292D38]">•</span>
              <span className="text-xs font-bold text-[#A7A9B4]">{show.format}</span>
              <span className="text-xs text-[#292D38]">•</span>
              <button
                type="button"
                onClick={() => loadShow(true)}
                title="Refresh seat availability"
                className="inline-flex items-center gap-1 text-[11px] text-[#A7A9B4] hover:text-white"
              >
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                <span>Live Sync</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
              {show.movieTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#A7A9B4]">
              <span className="flex items-center gap-1 font-semibold text-white">
                <MapPin className="w-3.5 h-3.5 text-[#E5093F]" />
                {show.cinemaName} ({show.screenName})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {show.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {show.time}
              </span>
            </div>
          </div>

          {/* Pricing Legend Badges */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#171A23] border border-emerald-500/30 text-center">
              <div className="text-[10px] text-emerald-400 font-semibold">Regular (A–E)</div>
              <div className="font-bold text-white">₹{show.pricing.regular}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#171A23] border border-blue-500/30 text-center">
              <div className="text-[10px] text-blue-400 font-semibold">Premium (F–H)</div>
              <div className="font-bold text-white">₹{show.pricing.premium}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#171A23] border border-amber-500/30 text-center">
              <div className="text-[10px] text-amber-400 font-semibold">Recliner (I–J)</div>
              <div className="font-bold text-white">₹{show.pricing.recliner}</div>
            </div>
          </div>
        </div>

        {/* Concurrency Collision Notice Banner */}
        {collisionAlert && (
          <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span className="font-bold">{collisionAlert}</span>
            </div>
            <button
              onClick={() => setCollisionAlert(null)}
              className="text-xs font-bold text-white hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* CINEMA SCREEN VISUALIZER */}
        <div className="mt-8 mb-12 text-center max-w-2xl mx-auto">
          <div className="h-4 w-full bg-gradient-to-b from-[#E5093F] to-transparent rounded-t-[100px] opacity-80" />
          <div className="h-6 w-full mb-2 bg-gradient-to-b from-[#E5093F]/20 to-transparent blur-sm" />
          <p className="text-[11px] font-bold tracking-[0.25em] text-[#A7A9B4] uppercase font-heading">
            All Eyes This Way • Cinema Screen
          </p>
        </div>

        {/* SEAT GRID */}
        <div className="bg-[#101219] border border-[#292D38] rounded-3xl p-6 sm:p-10 shadow-2xl overflow-x-auto">
          <div className="min-w-[640px] max-w-2xl mx-auto space-y-3">
            {ROWS.map((row) => {
              const category = getSeatCategory(row);
              const price = getSeatPrice(row);
              const isFirstOfCategory = row === 'J' || row === 'H' || row === 'E';

              return (
                <div key={row} className="space-y-1">
                  {isFirstOfCategory && (
                    <div className="pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-[#A7A9B4] border-t border-[#292D38]/50 uppercase tracking-wider font-heading">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            category === 'recliner'
                              ? 'bg-amber-400'
                              : category === 'premium'
                              ? 'bg-blue-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        {category} Row ({row === 'J' ? 'Rows I–J' : row === 'H' ? 'Rows F–H' : 'Rows A–E'})
                      </span>
                      <span>₹{price} / seat</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    {/* Row Letter Left */}
                    <span className="w-5 text-center text-xs font-bold text-[#A7A9B4]">{row}</span>

                    {/* Seats with Aisle gaps (1-4 | aisle | 5-8 | aisle | 9-12) */}
                    <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2">
                      {[...Array(COLS)].map((_, colIdx) => {
                        const seatNum = colIdx + 1;
                        const seatId = `${row}${seatNum}`;
                        const isBooked = bookedSet.has(seatId);
                        const isSelected = selectedSeats.includes(seatId);

                        // Aisle margins (after seat 4 and seat 8)
                        const isAisleRight = seatNum === 4 || seatNum === 8;

                        return (
                          <div
                            key={seatId}
                            className={`flex items-center ${isAisleRight ? 'mr-4 sm:mr-6' : ''}`}
                          >
                            <button
                              type="button"
                              disabled={isBooked}
                              onClick={() => toggleSeat(seatId)}
                              title={`${seatId} • ₹${price} (${category})`}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center cursor-pointer ${
                                isBooked
                                  ? 'bg-[#1C1F2A] border border-[#292D38] text-[#555A6B] cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-[#E5093F] border border-[#FF3D61] text-white shadow-lg shadow-[#E5093F]/50 scale-105'
                                  : category === 'recliner'
                                  ? 'bg-[#171A23] border border-amber-500/40 text-amber-200 hover:border-amber-400 hover:scale-105'
                                  : category === 'premium'
                                  ? 'bg-[#171A23] border border-blue-500/40 text-blue-200 hover:border-blue-400 hover:scale-105'
                                  : 'bg-[#171A23] border border-[#292D38] text-[#A7A9B4] hover:border-white hover:text-white hover:scale-105'
                              }`}
                            >
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : seatNum}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Row Letter Right */}
                    <span className="w-5 text-center text-xs font-bold text-[#A7A9B4]">{row}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seat Legend */}
          <div className="mt-8 pt-6 border-t border-[#292D38] flex flex-wrap items-center justify-center gap-6 text-xs text-[#A7A9B4]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#171A23] border border-[#292D38]" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#E5093F] border border-[#FF3D61] text-white flex items-center justify-center text-[10px]">
                ✓
              </div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#1C1F2A] border border-[#292D38] text-[#555A6B] flex items-center justify-center text-[10px]">
                ✕
              </div>
              <span>Reserved / Occupied</span>
            </div>
          </div>
        </div>

        {/* BOTTOM STICKY BOOKING SUMMARY BAR */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#101219]/95 backdrop-blur-md border-t border-[#292D38] p-4 shadow-2xl">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div>
                <div className="text-xs text-[#A7A9B4]">
                  Selected Seats ({selectedSeats.length} / max 8):
                </div>
                <div className="text-sm font-black text-white flex flex-wrap items-center gap-1.5 mt-0.5">
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-[#E5093F]/20 border border-[#E5093F]/40 text-[#FF3D61] text-xs font-bold"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#A7A9B4] text-xs font-normal">
                      Click available seats above to reserve
                    </span>
                  )}
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="border-l border-[#292D38] pl-4">
                  <div className="text-xs text-[#A7A9B4]">Ticket Subtotal:</div>
                  <div className="text-base font-black text-white">₹{subtotal}</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={handleProceedToCheckout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#E5093F] hover:bg-[#FF3D61] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-[#E5093F]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL (Guest Demo Compatible) */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#101219] border border-[#292D38] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#292D38]">
              <div>
                <h3 className="text-xl font-black text-white font-heading">Complete Reservation</h3>
                <p className="text-xs text-[#A7A9B4]">Server-Authoritative Demo Ticket Checkout</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="text-[#A7A9B4] hover:text-white p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error / Collision display */}
            {collisionAlert && (
              <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{collisionAlert}</span>
              </div>
            )}

            {/* Movie summary card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#171A23] border border-[#292D38]">
              <img
                src={show.moviePoster}
                alt={show.movieTitle}
                className="w-14 h-20 object-cover rounded-xl shrink-0 border border-[#292D38]"
              />
              <div className="space-y-1">
                <h4 className="font-black text-sm text-white line-clamp-1 font-heading">
                  {show.movieTitle}
                </h4>
                <p className="text-xs text-[#A7A9B4]">
                  {show.cinemaName} • {show.screenName}
                </p>
                <p className="text-xs text-[#FF3D61] font-semibold">
                  {show.date} at {show.time} ({show.format})
                </p>
              </div>
            </div>

            {/* Guest / User Contact Info */}
            <div className="p-4 rounded-2xl bg-[#171A23] border border-[#292D38] space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#E5093F]" />
                <span>Guest Attendee Information</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#A7A9B4] font-semibold uppercase block mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#101219] border border-[#292D38] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E5093F]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#A7A9B4] font-semibold uppercase block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-[#101219] border border-[#292D38] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E5093F]"
                  />
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="p-4 rounded-2xl bg-[#171A23] border border-[#292D38] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1 text-[#FF3D61]">
                  <Tag className="w-3.5 h-3.5" />
                  Apply Promo Code
                </span>
                <span className="text-[10px] text-[#A7A9B4]">Try IMOVIES50, FIRSTSHOW</span>
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. IMOVIES50"
                  className="flex-1 bg-[#101219] border border-[#292D38] rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#E5093F]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E5093F] text-white text-xs font-bold rounded-xl hover:bg-[#FF3D61] cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                  <Check className="w-3.5 h-3.5" />
                  Promo "{appliedCoupon}" applied! Saved ₹{couponDiscount}.
                </div>
              )}
              {couponError && (
                <div className="text-xs text-red-400 font-semibold pt-1">
                  {couponError}
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="p-4 rounded-2xl bg-[#171A23] border border-[#292D38] space-y-2.5 text-xs">
              <div className="flex justify-between text-[#A7A9B4]">
                <span>Tickets ({selectedSeats.length} seats: {selectedSeats.join(', ')})</span>
                <span className="text-white font-semibold">₹{subtotal}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-[#A7A9B4]">
                <span>Convenience Fee (₹35 / seat)</span>
                <span className="text-white font-semibold">₹{convenienceFee}</span>
              </div>

              <div className="flex justify-between text-[#A7A9B4]">
                <span>Integrated GST (18%)</span>
                <span className="text-white font-semibold">₹{taxes}</span>
              </div>

              <div className="pt-2 border-t border-[#292D38] flex justify-between text-sm font-black text-white">
                <span>Grand Total</span>
                <span className="text-base text-[#E5093F]">₹{totalAmount}</span>
              </div>
            </div>

            {/* Demo Payment Notice */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Demonstration Payment Flow: Clicking confirm will atomically lock and reserve your seats on the backend with mutex concurrency protection.
              </span>
            </div>

            {/* Confirm button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmBooking}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#E5093F] hover:bg-[#FF3D61] disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-[#E5093F]/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>
                {isProcessing
                  ? 'Atomically Reserving Seats...'
                  : `Confirm Demo Booking • ₹${totalAmount}`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
