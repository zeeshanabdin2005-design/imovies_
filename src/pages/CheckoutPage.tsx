import React, { useEffect, useState, useId } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { Show, SeatCategory, Booking } from '../types';
import {
  fetchShowDetails,
  calculateBookingPrice,
  checkoutBooking
} from '../services/movieApi';
import { useAuth } from '../context/AuthContext';
import {
  Film,
  Calendar,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  QrCode,
  Building2,
  Sparkles,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Retrieve parameters from router state or query parameters (?showId=...&seats=A1,A2)
  const navState = (location.state as any) || {};
  const showIdFromParam = searchParams.get('showId') || navState.showId || '';
  const seatsParam = searchParams.get('seats');
  const initialSeats: string[] = navState.seats || (seatsParam ? seatsParam.split(',').filter(Boolean) : []);

  const [showId] = useState<string>(showIdFromParam);
  const [selectedSeats] = useState<string[]>(initialSeats);
  const [show, setShow] = useState<Show | null>(navState.show || null);
  const [loadingShow, setLoadingShow] = useState(!show);

  // Guest details state with initial values
  const [fullName, setFullName] = useState(() => {
    return user?.displayName || localStorage.getItem('imovies_demo_guest_name') || 'Aarav Sharma';
  });
  const [email, setEmail] = useState(() => {
    return user?.email || localStorage.getItem('imovies_demo_guest_email') || 'aarav.sharma@example.com';
  });
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem('imovies_demo_guest_phone') || '9893012345';
  });

  // Form field touched/errors
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; phone?: boolean }>({});
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Authoritative Pricing state from server
  const [pricing, setPricing] = useState<{
    ticketSubtotal: number;
    convenienceFee: number;
    taxes: number;
    discountAmount: number;
    totalAmount: number;
    seatCategories: Record<string, SeatCategory>;
    appliedCoupon?: string;
  } | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Demo Payment simulation state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionOutcome, setSubmissionOutcome] = useState<'idle' | 'success' | 'failure'>('idle');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [simulatedFailureDetails, setSimulatedFailureDetails] = useState<string | null>(null);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  // Unique session idempotency token to prevent double-charging on duplicate clicks
  const [idempotencyKey] = useState<string>(() => `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Load show details if not in location state
  useEffect(() => {
    if (!showId) return;
    if (show) return;

    setLoadingShow(true);
    fetchShowDetails(showId)
      .then((data) => {
        setShow(data);
        setLoadingShow(false);
      })
      .catch((err) => {
        console.error('Failed to load show:', err);
        setGeneralError('Show details could not be loaded. Please return to the schedule.');
        setLoadingShow(false);
      });
  }, [showId, show]);

  // Server-authoritative price calculation whenever seats or appliedCoupon changes
  useEffect(() => {
    if (selectedSeats.length === 0) return;

    setCalculatingPrice(true);
    calculateBookingPrice(selectedSeats, appliedCoupon || undefined)
      .then((res) => {
        setPricing(res);
        setCalculatingPrice(false);
      })
      .catch((err) => {
        console.error('Price calculation error:', err);
        setCalculatingPrice(false);
      });
  }, [selectedSeats, appliedCoupon]);

  // Validation functions
  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; phone?: string } = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.name = 'Full name is required (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Coupon handling
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    setCouponError(null);

    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const validCodes = ['IMOVIES50', 'FIRSTSHOW', 'WEEKEND20'];
    if (!validCodes.includes(code)) {
      setCouponError(`Coupon code "${code}" is invalid or expired. Try IMOVIES50, FIRSTSHOW, or WEEKEND20.`);
      return;
    }

    setAppliedCoupon(code);
    setCouponInput(code);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  // Payment Execution (Success or Failure Simulation)
  const handleExecutePayment = async (outcome: 'success' | 'failure') => {
    setTouched({ name: true, email: true, phone: true });
    setGeneralError(null);
    setCollisionWarning(null);
    setSimulatedFailureDetails(null);

    if (!validateForm()) {
      return;
    }

    if (!show || selectedSeats.length === 0) {
      setGeneralError('Invalid booking state: Showtime or seats are missing.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionOutcome(outcome);

    // Save guest credentials in localStorage for persistent user convenience
    localStorage.setItem('imovies_demo_guest_name', fullName.trim());
    localStorage.setItem('imovies_demo_guest_email', email.trim());
    localStorage.setItem('imovies_demo_guest_phone', phone.trim());

    // Determine guest ID
    const effectiveUserId = user?.uid || localStorage.getItem('imovies_demo_guest_id') || `guest_${Date.now()}`;
    localStorage.setItem('imovies_demo_guest_id', effectiveUserId);

    const methodLabels: Record<string, string> = {
      upi: 'Demo UPI (Google Pay / PhonePe)',
      card: 'Demo Credit/Debit Card',
      netbanking: 'Demo NetBanking Gateway'
    };

    try {
      const idToken = user ? await user.getIdToken().catch(() => undefined) : undefined;

      const res = await checkoutBooking({
        showId: show.id,
        seats: selectedSeats,
        userId: effectiveUserId,
        userName: fullName.trim(),
        userEmail: email.trim(),
        userPhone: phone.trim(),
        couponCode: appliedCoupon || undefined,
        simulateOutcome: outcome,
        paymentMethodName: methodLabels[selectedPaymentMethod],
        idempotencyKey,
        idToken
      });

      if (!res.success) {
        if (res.conflict) {
          setCollisionWarning(res.message);
          setIsSubmitting(false);
          return;
        }

        if (res.paymentFailed) {
          // Explicit simulated failure
          setSimulatedFailureDetails(
            res.message || 'Payment simulation declined: Card limit exceeded or bank simulated drop.'
          );
          setIsSubmitting(false);
          return;
        }

        setGeneralError(res.message || 'Payment processing failed. Please check your details.');
        setIsSubmitting(false);
        return;
      }

      // Successful Booking!
      if (res.booking) {
        // Cache to local bookings
        try {
          const localList: Booking[] = JSON.parse(localStorage.getItem('imovies_user_bookings') || '[]');
          const filtered = localList.filter((b) => b.id !== res.booking!.id);
          filtered.unshift(res.booking);
          localStorage.setItem('imovies_user_bookings', JSON.stringify(filtered));
        } catch {}

        // Best effort sync to Firestore if user is authenticated
        if (user) {
          import('../services/firebase').then(({ db }) => {
            import('firebase/firestore').then(({ doc, setDoc }) => {
              setDoc(doc(db, 'bookings', res.booking!.id), res.booking)
                .catch((err) => console.warn('Firestore booking sync notice:', err));
            });
          }).catch(() => {});
        }

        // Navigate immediately to ticket confirmation page
        navigate(`/booking/${res.booking.id}`, {
          state: { booking: res.booking }
        });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setGeneralError(err.message || 'An unexpected server error occurred during checkout.');
      setIsSubmitting(false);
    }
  };

  if (loadingShow) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#E5093F] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[#A7A9B4]">Preparing secure IMovies checkout session...</p>
      </div>
    );
  }

  if (!show || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-[#08090D] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-heading">No Seats Selected for Checkout</h2>
        <p className="text-sm text-[#A7A9B4] max-w-md">
          Please choose a movie and select your auditorium seats before proceeding to payment.
        </p>
        <Link
          to="/movies"
          className="px-6 py-3 rounded-full bg-[#E5093F] text-white text-xs font-bold hover:bg-[#FF3D61] transition-all"
        >
          Explore Now Showing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F5F7] py-8 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#A1A5B3]">
          <Link to="/movies" className="hover:text-white">Movies</Link>
          <span>/</span>
          <Link to={`/movies/${show.movieImdbId}`} className="hover:text-white line-clamp-1 max-w-[150px]">
            {show.movieTitle}
          </Link>
          <span>/</span>
          <Link to={`/shows/${show.id}/seats`} className="hover:text-white">Seats ({selectedSeats.length})</Link>
          <span>/</span>
          <span className="text-[#E5093F] font-bold">Secure Checkout</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292D38]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">Review & Checkout</h1>
            <p className="text-xs text-[#A1A5B3] mt-1">
              Verify guest admission details, apply promotional coupons, and simulate demo payment.
            </p>
          </div>
          <Link
            to={`/shows/${show.id}/seats`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A5B3] hover:text-white bg-[#101219] border border-[#292D38] px-3.5 py-2 rounded-xl self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change Seats
          </Link>
        </div>

        {/* Global Collision / Error Alerts */}
        {collisionWarning && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">Seat Conflict Detected</h4>
              <p className="text-xs">{collisionWarning}</p>
              <Link
                to={`/shows/${show.id}/seats`}
                className="inline-block mt-2 text-xs font-bold text-white bg-amber-500/30 hover:bg-amber-500/50 px-3 py-1.5 rounded-lg"
              >
                Return to Seat Map
              </Link>
            </div>
          </div>
        )}

        {generalError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">Checkout Notice</h4>
              <p className="text-xs">{generalError}</p>
            </div>
          </div>
        )}

        {/* Simulated Failure Warning Box */}
        {simulatedFailureDetails && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-3 text-rose-200 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Simulated Payment Failed
                </h4>
                <span className="text-[10px] font-mono bg-rose-500/30 px-2 py-0.5 rounded text-rose-200">
                  Code: DEMO_DECLINE_SIM
                </span>
              </div>
              <p className="text-xs leading-relaxed">{simulatedFailureDetails}</p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExecutePayment('success')}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Retry with Successful Simulation
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedFailureDetails(null)}
                  className="text-xs text-[#A1A5B3] hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Left Column (Details & Payment) + Right Column (Order Summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Screening Details Snapshot */}
            <div className="p-5 rounded-2xl bg-[#101219] border border-[#292D38] flex items-center gap-4">
              <img
                src={show.moviePoster}
                alt={show.movieTitle}
                className="w-16 h-24 object-cover rounded-xl border border-[#292D38] shrink-0"
              />
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5093F]/20 text-[#E5093F] border border-[#E5093F]/30 uppercase font-heading">
                    {show.format}
                  </span>
                  <span className="text-xs text-[#A1A5B3]">{show.language}</span>
                </div>
                <h3 className="text-base font-bold text-white truncate font-heading">{show.movieTitle}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A1A5B3] pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#E5093F]" /> {show.cinemaName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#E5093F]" /> {show.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#E5093F]" /> {show.time}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Guest Information Form */}
            <div className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#292D38]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                  <User className="w-4 h-4 text-[#E5093F]" /> Guest Admission Contact
                </h3>
                <span className="text-[11px] text-[#A1A5B3]">No account required</span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#F5F5F7] flex items-center justify-between">
                    <span>Full Name *</span>
                    {touched.name && formErrors.name && (
                      <span className="text-rose-400 font-normal">{formErrors.name}</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (touched.name) validateForm();
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, name: true }));
                        validateForm();
                      }}
                      placeholder="e.g. Aarav Sharma"
                      className={`w-full bg-[#171A23] border ${
                        touched.name && formErrors.name ? 'border-rose-500' : 'border-[#292D38]'
                      } rounded-xl px-3.5 py-2.5 text-white placeholder-[#5A5D6B] focus:outline-none focus:border-[#E5093F] transition-all`}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#F5F5F7] flex items-center justify-between">
                    <span>Email Address (for Digital Ticket & QR) *</span>
                    {touched.email && formErrors.email && (
                      <span className="text-rose-400 font-normal">{formErrors.email}</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) validateForm();
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, email: true }));
                        validateForm();
                      }}
                      placeholder="name@example.com"
                      className={`w-full bg-[#171A23] border ${
                        touched.email && formErrors.email ? 'border-rose-500' : 'border-[#292D38]'
                      } rounded-xl px-3.5 py-2.5 text-white placeholder-[#5A5D6B] focus:outline-none focus:border-[#E5093F] transition-all`}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#F5F5F7] flex items-center justify-between">
                    <span>Mobile Number (for SMS & Entry Alerts) *</span>
                    {touched.phone && formErrors.phone && (
                      <span className="text-rose-400 font-normal">{formErrors.phone}</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (touched.phone) validateForm();
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, phone: true }));
                        validateForm();
                      }}
                      placeholder="e.g. 9893012345"
                      className={`w-full bg-[#171A23] border ${
                        touched.phone && formErrors.phone ? 'border-rose-500' : 'border-[#292D38]'
                      } rounded-xl px-3.5 py-2.5 text-white placeholder-[#5A5D6B] focus:outline-none focus:border-[#E5093F] transition-all`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Promotional Coupon Section */}
            <div className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                <Tag className="w-4 h-4 text-[#E5093F]" /> Promotional Offers & Coupons
              </h3>

              {appliedCoupon ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300 font-mono">
                        {appliedCoupon} APPLIED
                      </div>
                      <div className="text-[11px] text-emerald-400/80">
                        {pricing?.discountAmount ? `Saved ₹${pricing.discountAmount} on this booking` : 'Discount applied successfully'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 text-xs font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError(null);
                      }}
                      placeholder="Enter promo code (e.g. IMOVIES50)"
                      className="flex-1 bg-[#171A23] border border-[#292D38] rounded-xl px-3.5 py-2 text-xs text-white uppercase placeholder-[#5A5D6B] focus:outline-none focus:border-[#E5093F]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="px-4 py-2 rounded-xl bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-xs text-rose-400">{couponError}</p>
                  )}

                  {/* Suggested Coupons */}
                  <div className="pt-1">
                    <div className="text-[11px] text-[#A1A5B3] mb-1.5 font-medium">Available Offers:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('IMOVIES50')}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#171A23] border border-[#292D38] hover:border-[#E5093F] text-[#F5F5F7] transition-all cursor-pointer"
                      >
                        IMOVIES50 (50% Off)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('FIRSTSHOW')}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#171A23] border border-[#292D38] hover:border-[#E5093F] text-[#F5F5F7] transition-all cursor-pointer"
                      >
                        FIRSTSHOW (Flat ₹100 Off)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('WEEKEND20')}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#171A23] border border-[#292D38] hover:border-[#E5093F] text-[#F5F5F7] transition-all cursor-pointer"
                      >
                        WEEKEND20 (20% Off)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. DEMO PAYMENT GATEWAY PANEL */}
            <div className="p-6 rounded-2xl bg-[#101219] border-2 border-[#E5093F]/40 space-y-6">
              {/* Important Prototype Simulation Badge */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold uppercase tracking-wider">DEMO PAYMENT MODE</div>
                  <p className="text-[#A1A5B3] leading-relaxed">
                    This prototype simulates realistic payment gateway authorization. No real money or card numbers will be charged.
                  </p>
                </div>
              </div>

              {/* Simulated Method Tabs */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                  Simulated Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('upi')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedPaymentMethod === 'upi'
                        ? 'bg-[#E5093F]/15 border-[#E5093F] text-white font-bold'
                        : 'bg-[#171A23] border-[#292D38] text-[#A1A5B3] hover:text-white'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#E5093F]" />
                    <span>Demo UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedPaymentMethod === 'card'
                        ? 'bg-[#E5093F]/15 border-[#E5093F] text-white font-bold'
                        : 'bg-[#171A23] border-[#292D38] text-[#A1A5B3] hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#E5093F]" />
                    <span>Demo Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('netbanking')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedPaymentMethod === 'netbanking'
                        ? 'bg-[#E5093F]/15 border-[#E5093F] text-white font-bold'
                        : 'bg-[#171A23] border-[#292D38] text-[#A1A5B3] hover:text-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-[#E5093F]" />
                    <span>NetBanking</span>
                  </button>
                </div>
              </div>

              {/* TWO TEST CONTROLS REQUIRED IN PHASE 4 */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold text-[#A1A5B3] uppercase tracking-wider font-heading">
                  Transaction Outcome Controls
                </div>

                {/* Button 1: Simulate Successful Payment */}
                <button
                  type="button"
                  onClick={() => handleExecutePayment('success')}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && submissionOutcome === 'success' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing Demo Payment & Claiming Seats...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate Successful Payment (Demo)</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {/* Button 2: Simulate Failed Payment */}
                <button
                  type="button"
                  onClick={() => handleExecutePayment('failure')}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#171A23] border border-rose-500/50 hover:bg-rose-500/10 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && submissionOutcome === 'failure' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      <span>Testing Gateway Rejection...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Simulate Failed Payment (Demo)</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#A1A5B3] pt-1">
                  Testing failure allows you to verify that no seats are falsely locked and the user can safely retry.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 5 cols (Sticky Order Breakdown) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-[#292D38]">
                <h3 className="text-base font-bold text-white font-heading">Order Summary</h3>
                <span className="text-xs font-mono font-bold text-[#E5093F] bg-[#E5093F]/10 px-2 py-0.5 rounded">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Ticket' : 'Tickets'}
                </span>
              </div>

              {/* Selected Seats Badges */}
              <div className="space-y-2">
                <div className="text-xs text-[#A1A5B3]">Allocated Seats ({show.screenName}):</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seatId) => {
                    const row = seatId.charAt(0);
                    const cat = ['I', 'J'].includes(row) ? 'Recliner' : ['F', 'G', 'H'].includes(row) ? 'Premium' : 'Regular';
                    return (
                      <span
                        key={seatId}
                        className="px-2.5 py-1 rounded-lg bg-[#171A23] border border-[#292D38] text-xs font-mono font-bold text-white flex items-center gap-1.5"
                      >
                        <span className="text-[#E5093F]">{seatId}</span>
                        <span className="text-[10px] text-[#A1A5B3] font-normal">({cat})</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-3 pt-2 text-xs border-t border-[#292D38]">
                <div className="flex justify-between text-[#A1A5B3]">
                  <span>Tickets Subtotal</span>
                  <span className="font-mono text-white">
                    {calculatingPrice ? 'Calculating...' : `₹${pricing?.ticketSubtotal || 0}`}
                  </span>
                </div>

                {pricing && pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Promo Discount ({appliedCoupon})</span>
                    <span className="font-mono">-₹{pricing.discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#A1A5B3]">
                  <span>Convenience Fee (₹35 × {selectedSeats.length})</span>
                  <span className="font-mono text-white">
                    {calculatingPrice ? '...' : `₹${pricing?.convenienceFee || (selectedSeats.length * 35)}`}
                  </span>
                </div>

                <div className="flex justify-between text-[#A1A5B3]">
                  <span>Integrated GST (18%)</span>
                  <span className="font-mono text-white">
                    {calculatingPrice ? '...' : `₹${pricing?.taxes || 0}`}
                  </span>
                </div>

                <div className="pt-4 border-t border-[#292D38] flex justify-between items-baseline">
                  <div>
                    <div className="text-sm font-bold text-white font-heading">Total Amount</div>
                    <div className="text-[10px] text-[#A1A5B3]">Inclusive of all applicable taxes</div>
                  </div>
                  <div className="text-2xl font-black text-[#E5093F] font-mono">
                    {calculatingPrice ? '...' : `₹${pricing?.totalAmount || 0}`}
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-[#292D38] space-y-2 text-[11px] text-[#A1A5B3]">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-Bit SSL Encrypted Prototype Protocol</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Server-authoritative concurrency protection active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
