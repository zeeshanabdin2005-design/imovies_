import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import type { Booking } from '../types';
import { fetchBooking } from '../services/movieApi';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Printer,
  Ticket,
  Film,
  ArrowLeft,
  Share2,
  Sparkles,
  Info,
  ShieldCheck,
  User,
  Phone,
  Mail,
  QrCode,
  Lock
} from 'lucide-react';

export const TicketConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();

  const [booking, setBooking] = useState<Booking | null>(
    (location.state as any)?.booking || null
  );
  const [loading, setLoading] = useState(!booking);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (booking || !bookingId) return;

    setLoading(true);
    fetchBooking(bookingId)
      .then((data) => {
        setBooking(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Fetch booking error:', err);
        // Fallback to checking local storage bookings
        try {
          const localList: Booking[] = JSON.parse(
            localStorage.getItem('imovies_user_bookings') || '[]'
          );
          const found = localList.find(
            (b) => b.id === bookingId || b.bookingReference === bookingId
          );
          if (found) {
            setBooking(found);
          }
        } catch {}
        setLoading(false);
      });
  }, [bookingId, booking]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!booking) return;

    const shareData = {
      title: `IMovies Ticket: ${booking.movieTitle}`,
      text: `🎟️ I booked tickets for ${booking.movieTitle} at ${booking.cinemaName}! Ref: ${booking.bookingReference}, Seats: ${booking.seats.join(', ')}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }

    // Fallback to clipboard
    navigator.clipboard.writeText(
      `IMovies Admission Pass\nMovie: ${booking.movieTitle}\nCinema: ${booking.cinemaName} (${booking.screenName})\nDate & Time: ${booking.showDate} at ${booking.showTime}\nSeats: ${booking.seats.join(', ')}\nRef: ${booking.bookingReference}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#E5093F] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[#A7A9B4]">Generating your digital cinema pass...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
        <h2 className="text-xl font-bold font-heading">Booking Not Found</h2>
        <p className="text-xs text-[#A7A9B4]">
          Could not locate ticket credentials for ID: {bookingId}
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full bg-[#E5093F] text-white text-xs font-bold hover:bg-[#FF3D61]"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090D] text-white py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-2 no-print">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white font-heading">Booking Confirmed!</h1>
          <p className="text-xs text-[#A7A9B4] max-w-md mx-auto">
            Your admission tickets are atomically locked in the IMovies reservation system. Show this digital pass at the auditorium entrance.
          </p>
        </div>

        {/* DIGITAL ADMISSION PASS (Printable) */}
        <div className="print-ticket-area relative bg-[#101219] border-2 border-[#292D38] rounded-3xl overflow-hidden shadow-2xl print:border-black print:bg-white print:text-black">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-[#E5093F] to-[#FF3D61] p-4 flex items-center justify-between text-white print:bg-[#E5093F]">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              <span className="font-black text-base tracking-wider font-heading">IMOVIES ADMISSION PASS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 px-3 py-1 rounded-full border border-white/20">
                {booking.status}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Top reference and movie info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#292D38] print:border-gray-300">
              <div className="flex items-center gap-4">
                <img
                  src={booking.moviePoster}
                  alt={booking.movieTitle}
                  className="w-16 h-24 object-cover rounded-xl border border-[#292D38] shrink-0 print:border-gray-300"
                />
                <div>
                  <h3 className="text-xl font-black text-white print:text-black line-clamp-1 font-heading">
                    {booking.movieTitle}
                  </h3>
                  <p className="text-xs text-[#A7A9B4] print:text-gray-600">
                    {booking.format} • Bhopal Cinema Screening
                  </p>
                  <div className="mt-2 text-xs font-mono font-bold text-[#E5093F] bg-[#E5093F]/10 border border-[#E5093F]/30 px-2.5 py-1 rounded-lg inline-block print:bg-gray-100 print:text-black">
                    Ref: {booking.bookingReference}
                  </div>
                </div>
              </div>

              {/* Guest Details */}
              <div className="text-left sm:text-right text-xs space-y-0.5">
                <div className="text-[#A7A9B4] print:text-gray-500 font-medium">Guest Ticket Holder</div>
                <div className="font-bold text-white print:text-black text-sm">{booking.userName}</div>
                <div className="text-[#A7A9B4] print:text-gray-600 text-[11px]">{booking.userEmail}</div>
                {booking.userPhone && (
                  <div className="text-[#A7A9B4] print:text-gray-600 text-[11px]">Mob: {booking.userPhone}</div>
                )}
              </div>
            </div>

            {/* Schedule & Venue Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#171A23] border border-[#292D38] print:bg-gray-50 print:border-gray-300">
                <div className="text-[10px] text-[#A7A9B4] print:text-gray-500 uppercase font-bold flex items-center gap-1 font-heading">
                  <Calendar className="w-3 h-3 text-[#E5093F]" />
                  Show Date
                </div>
                <div className="font-bold text-white print:text-black text-sm mt-1">{booking.showDate}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#171A23] border border-[#292D38] print:bg-gray-50 print:border-gray-300">
                <div className="text-[10px] text-[#A7A9B4] print:text-gray-500 uppercase font-bold flex items-center gap-1 font-heading">
                  <Clock className="w-3 h-3 text-[#E5093F]" />
                  Showtime
                </div>
                <div className="font-bold text-white print:text-black text-sm mt-1">{booking.showTime}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#171A23] border border-[#292D38] col-span-2 sm:col-span-1 print:bg-gray-50 print:border-gray-300">
                <div className="text-[10px] text-[#A7A9B4] print:text-gray-500 uppercase font-bold flex items-center gap-1 font-heading">
                  <Ticket className="w-3 h-3 text-[#E5093F]" />
                  Total Seats ({booking.seats.length})
                </div>
                <div className="font-bold text-[#FF3D61] print:text-[#E5093F] text-sm mt-1">
                  {booking.seats.join(', ')}
                </div>
              </div>
            </div>

            {/* Venue location */}
            <div className="p-4 rounded-xl bg-[#171A23] border border-[#292D38] flex items-center gap-3 print:bg-gray-50 print:border-gray-300">
              <div className="p-2.5 rounded-lg bg-[#E5093F]/10 text-[#E5093F] print:bg-gray-200">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-black text-white print:text-black text-sm font-heading">{booking.cinemaName}</div>
                <div className="text-[#A7A9B4] print:text-gray-600">{booking.screenName} • Bhopal, Madhya Pradesh</div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="p-4 rounded-xl bg-[#171A23]/50 border border-[#292D38] space-y-1.5 text-xs text-[#A7A9B4] print:bg-gray-50 print:border-gray-300 print:text-gray-700">
              <div className="flex justify-between">
                <span>Tickets Subtotal ({booking.seats.length} seats):</span>
                <span className="text-white print:text-black font-semibold">₹{booking.ticketSubtotal}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-emerald-700 font-semibold">
                  <span>Promo Discount ({booking.couponCode || 'APPLIED'}):</span>
                  <span>-₹{booking.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Convenience Fee:</span>
                <span className="text-white print:text-black font-semibold">₹{booking.convenienceFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Integrated GST (18%):</span>
                <span className="text-white print:text-black font-semibold">₹{booking.taxes}</span>
              </div>
              <div className="pt-2 border-t border-[#292D38] print:border-gray-300 flex justify-between text-sm font-black text-white print:text-black">
                <span>Total Amount Paid:</span>
                <span className="text-[#E5093F] text-base font-bold">₹{booking.totalAmount}</span>
              </div>
            </div>

            {/* Payment Method & Demo Badge */}
            <div className="p-3 rounded-xl bg-[#171A23] border border-[#292D38] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs print:border-gray-300">
              <div className="text-[#A7A9B4] print:text-gray-600">
                Payment Channel: <span className="text-white print:text-black font-semibold">{booking.paymentMethod}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 print:text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Demo Verified (Simulation)
              </div>
            </div>

            {/* Barcode & QR Code Section */}
            <div className="pt-4 border-t-2 border-dashed border-[#292D38] print:border-gray-400 text-center space-y-3">
              {/* Simulated barcode graphic */}
              <div className="flex justify-center items-center gap-1 h-12 px-6 py-2 bg-white rounded-lg mx-auto max-w-sm">
                {[...Array(44)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${
                      i % 4 === 0 ? 'w-1.5 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-1 bg-black'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] font-mono font-bold text-[#A7A9B4] print:text-black">
                *{booking.bookingReference}*
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 print:text-black print:bg-gray-100 text-[11px] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>
                  Present this admission pass at the auditorium usher check-in. Valid for single screening.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-center gap-4 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#171A23] hover:bg-[#1E222E] border border-[#292D38] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#E5093F]" />
            <span>Print Ticket Pass / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#171A23] hover:bg-[#1E222E] border border-[#292D38] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#FF3D61]" />
            <span>{copied ? 'Copied Details!' : 'Share Pass'}</span>
          </button>

          <Link
            to="/my-bookings"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-bold transition-all shadow-lg shadow-[#E5093F]/25"
          >
            <Ticket className="w-4 h-4" />
            <span>View All My Bookings</span>
          </Link>

          <Link
            to="/movies"
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-transparent hover:bg-[#171A23] text-[#A7A9B4] hover:text-white text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Book Another Movie</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
