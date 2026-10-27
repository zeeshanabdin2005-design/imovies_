import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, cancelBookingAtomic } from '../services/firebase';
import type { Cinema, Show, Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { CURATED_MOVIES } from '../data/curatedMovies';
import {
  ShieldCheck,
  Film,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  DollarSign,
  Ticket,
  Plus,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle2,
  Tv
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'shows' | 'cinemas' | 'bookings'>('overview');
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // New Show Form State
  const [newMovieId, setNewMovieId] = useState(CURATED_MOVIES[0].imdbID);
  const [newCinemaId, setNewCinemaId] = useState('');
  const [newScreenName, setNewScreenName] = useState('Audi 1 - Dolby Atmos');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('18:00');
  const [newFormat, setNewFormat] = useState('2D');
  const [newRegPrice, setNewRegPrice] = useState(200);
  const [newPremPrice, setNewPremPrice] = useState(320);
  const [newReclPrice, setNewReclPrice] = useState(480);
  const [creatingShow, setCreatingShow] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cinemasSnap, showsSnap, bookingsSnap] = await Promise.all([
        getDocs(collection(db, 'cinemas')),
        getDocs(collection(db, 'shows')),
        getDocs(collection(db, 'bookings'))
      ]);

      const cList = cinemasSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Cinema));
      const sList = showsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Show));
      const bList = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));

      setCinemas(cList);
      setShows(sList);
      setBookings(bList);
      if (cList.length > 0 && !newCinemaId) {
        setNewCinemaId(cList[0].id);
      }
    } catch (err) {
      console.warn('Admin data load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Add Show
  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingShow(true);
    setFormMsg(null);

    try {
      const selectedMovie = CURATED_MOVIES.find((m) => m.imdbID === newMovieId) || CURATED_MOVIES[0];
      const selectedCinema = cinemas.find((c) => c.id === newCinemaId) || cinemas[0];

      const showId = `show-${selectedCinema.id.replace('cinema-', '')}-${selectedMovie.imdbID}-${newDate}-${newTime.replace(':', '')}`;
      const showRef = doc(db, 'shows', showId);

      const newShowData: Show = {
        id: showId,
        movieImdbId: selectedMovie.imdbID,
        movieTitle: selectedMovie.title || selectedMovie.Title || 'Untitled Movie',
        moviePoster: selectedMovie.poster || selectedMovie.Poster || '',
        cinemaId: selectedCinema.id,
        cinemaName: selectedCinema.name,
        screenId: 'screen-custom',
        screenName: newScreenName,
        date: newDate,
        time: newTime,
        format: newFormat,
        language: 'English',
        pricing: {
          regular: Number(newRegPrice),
          premium: Number(newPremPrice),
          recliner: Number(newReclPrice)
        },
        bookedSeats: [],
        totalSeats: 120,
        availableSeatsCount: 120,
        createdAt: new Date().toISOString()
      };

      await setDoc(showRef, newShowData);
      setFormMsg({ text: `Successfully added showtime for "${selectedMovie.Title}"!`, type: 'success' });
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setFormMsg({ text: err?.message || 'Failed to schedule show.', type: 'error' });
    } finally {
      setCreatingShow(false);
    }
  };

  // Handle Delete Show
  const handleDeleteShow = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this showtime?')) return;
    try {
      await deleteDoc(doc(db, 'shows', id));
      setShows((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert('Error deleting show: ' + err.message);
    }
  };

  // Handle Cancel Booking
  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Cancel this customer booking? This will restore seats to the show.')) return;
    try {
      await cancelBookingAtomic(id, user?.uid || 'admin', true);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err: any) {
      alert('Error cancelling booking: ' + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center p-6 text-center space-y-5 text-white">
        <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black">Administrator Access Restricted</h2>
        <p className="text-xs text-[#A7A9B4] max-w-md leading-relaxed">
          The Admin Dashboard is protected by Cloud Firestore security rules. Authorized admin: <span className="text-white font-mono">zeeshanabdin2005@gmail.com</span>.
        </p>
        <p className="text-xs text-[#A7A9B4]">Administrator privileges are granted only by trusted account configuration. A frontend demo toggle is intentionally unavailable.</p>
      </div>
    );
  }

  // Aggregate stats
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const confirmedBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-[#08090D] text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#292D38]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">
                Verified Administrator
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">IMovies Admin Console</h1>
            <p className="text-xs text-[#A7A9B4]">
              Manage Bhopal cinema venues, schedule showtimes, and audit customer bookings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              className="px-4 py-2 rounded-xl bg-[#171A23] hover:bg-[#1E222E] border border-[#292D38] text-xs font-bold text-white transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#101219] border border-[#292D38] p-1.5 rounded-2xl max-w-lg">
          {(['overview', 'shows', 'cinemas', 'bookings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#E5093F] text-white shadow-md'
                  : 'text-[#A7A9B4] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-2">
                <div className="flex items-center justify-between text-amber-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A7A9B4]">
                    Total Demo Revenue
                  </span>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-white">₹{totalRevenue}</div>
                <div className="text-[11px] text-[#A7A9B4]">Across all Bhopal bookings</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-2">
                <div className="flex items-center justify-between text-[#E5093F]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A7A9B4]">
                    Confirmed Bookings
                  </span>
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-white">{confirmedBookingsCount}</div>
                <div className="text-[11px] text-emerald-400">Atomic transactions logged</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-2">
                <div className="flex items-center justify-between text-blue-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A7A9B4]">
                    Scheduled Shows
                  </span>
                  <Film className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-white">{shows.length}</div>
                <div className="text-[11px] text-[#A7A9B4]">Across Bhopal multiplexes</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-2">
                <div className="flex items-center justify-between text-purple-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A7A9B4]">
                    Active Theatres
                  </span>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-white">{cinemas.length}</div>
                <div className="text-[11px] text-[#A7A9B4]">Bhopal regional hub</div>
              </div>
            </div>

            {/* Recent Bookings in Overview */}
            <div className="p-6 rounded-3xl bg-[#101219] border border-[#292D38] space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#E5093F]" />
                Recent Reservation Activity
              </h3>

              {bookings.length === 0 ? (
                <p className="text-xs text-[#A7A9B4]">No customer bookings made yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#292D38] text-[#A7A9B4]">
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3">Movie</th>
                        <th className="py-2.5 px-3">Cinema</th>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Seats</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#292D38]/50">
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} className="hover:bg-[#171A23]/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#E5093F]">
                            {b.bookingReference}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {b.movieTitle}
                          </td>
                          <td className="py-2.5 px-3 text-[#A7A9B4]">{b.cinemaName}</td>
                          <td className="py-2.5 px-3 text-white">
                            {b.showDate} {b.showTime}
                          </td>
                          <td className="py-2.5 px-3 text-amber-300 font-bold">
                            {b.seats.join(', ')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">
                            ₹{b.totalAmount}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SHOWS TAB */}
        {activeTab === 'shows' && (
          <div className="space-y-8">
            {/* Create Show Form */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#101219] border border-[#292D38] space-y-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E5093F]" />
                Schedule New Showtime
              </h3>

              {formMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    formMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  {formMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{formMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateShow} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Select Movie</label>
                    <select
                      value={newMovieId}
                      onChange={(e) => setNewMovieId(e.target.value)}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    >
                      {CURATED_MOVIES.map((m) => (
                        <option key={m.imdbID} value={m.imdbID}>
                          {m.Title} ({m.Year})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Cinema Venue</label>
                    <select
                      value={newCinemaId}
                      onChange={(e) => setNewCinemaId(e.target.value)}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    >
                      {cinemas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Screen Name</label>
                    <input
                      type="text"
                      value={newScreenName}
                      onChange={(e) => setNewScreenName(e.target.value)}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Time (24h)</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Screen Format</label>
                    <select
                      value={newFormat}
                      onChange={(e) => setNewFormat(e.target.value)}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    >
                      <option value="2D">2D Digital</option>
                      <option value="Dolby 3D">Dolby 3D</option>
                      <option value="IMAX 2D">IMAX 2D</option>
                      <option value="4DX Laser">4DX Laser</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Regular Seat Price (₹)</label>
                    <input
                      type="number"
                      value={newRegPrice}
                      onChange={(e) => setNewRegPrice(Number(e.target.value))}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Premium Seat Price (₹)</label>
                    <input
                      type="number"
                      value={newPremPrice}
                      onChange={(e) => setNewPremPrice(Number(e.target.value))}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A7A9B4] font-semibold mb-1">Recliner Seat Price (₹)</label>
                    <input
                      type="number"
                      value={newReclPrice}
                      onChange={(e) => setNewReclPrice(Number(e.target.value))}
                      className="w-full bg-[#171A23] border border-[#292D38] rounded-xl p-2.5 text-white outline-none focus:border-[#E5093F]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingShow}
                  className="px-6 py-3 rounded-xl bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-bold shadow-lg shadow-[#E5093F]/25 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creatingShow ? 'Scheduling...' : 'Save & Publish Showtime'}</span>
                </button>
              </form>
            </div>

            {/* Shows List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">All Active Showtimes ({shows.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shows.map((show) => (
                  <div
                    key={show.id}
                    className="p-4 rounded-2xl bg-[#101219] border border-[#292D38] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={show.moviePoster}
                        alt={show.movieTitle}
                        className="w-12 h-16 object-cover rounded-lg border border-[#292D38]"
                      />
                      <div className="space-y-0.5 text-xs">
                        <h4 className="font-bold text-white line-clamp-1">{show.movieTitle}</h4>
                        <p className="text-[#A7A9B4]">{show.cinemaName}</p>
                        <p className="text-[#A7A9B4]">
                          {show.date} • {show.time} ({show.format})
                        </p>
                        <p className="text-emerald-400 font-semibold">
                          ₹{show.pricing?.regular} reg • {show.availableSeatsCount} left
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteShow(show.id)}
                      className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-[#171A23]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CINEMAS TAB */}
        {activeTab === 'cinemas' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Cinema Venues in Bhopal ({cinemas.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cinemas.map((c) => (
                <div
                  key={c.id}
                  className="p-6 rounded-2xl bg-[#101219] border border-[#292D38] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-white">{c.name}</h4>
                    <span className="text-xs text-amber-400 font-bold">★ {c.rating}</span>
                  </div>
                  <p className="text-xs text-[#A7A9B4]">{c.location}</p>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {c.amenities.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded bg-[#171A23] text-[#A7A9B4]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKINGS AUDIT TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Customer Bookings Audit ({bookings.length})</h3>
            <div className="overflow-x-auto rounded-2xl bg-[#101219] border border-[#292D38]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#292D38] text-[#A7A9B4]">
                    <th className="py-3 px-4">Ref</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Movie</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Seats</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292D38]/50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#171A23]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#E5093F]">
                        {b.bookingReference}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{b.userName}</div>
                        <div className="text-[10px] text-[#A7A9B4]">{b.userEmail}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{b.movieTitle}</td>
                      <td className="py-3 px-4 text-[#A7A9B4]">
                        {b.showDate} {b.showTime}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-300">
                        {b.seats.join(', ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">₹{b.totalAmount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.id)}
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
