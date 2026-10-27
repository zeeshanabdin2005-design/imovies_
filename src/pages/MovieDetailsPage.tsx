import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Film,
  ArrowLeft,
  Ticket,
  MapPin,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Tv,
  CheckCircle,
  Database
} from 'lucide-react';
import { getMovieDetails, fetchShowtimes } from '../services/movieApi';
import type { MovieDetail, Show } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const MovieDetailsPage: React.FC = () => {
  const params = useParams<{ id?: string; imdbId?: string }>();
  const rawId = params.id || params.imdbId || '';
  const navigate = useNavigate();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Showtimes state
  const [shows, setShows] = useState<Show[]>([]);
  const [showsLoading, setShowsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const loadData = async () => {
    if (!rawId) {
      setError('No movie identifier provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch movie metadata from backend proxy (OMDb)
      const movieData = await getMovieDetails(rawId);
      setMovie(movieData);
      setLoading(false);

      // 2. Fetch live Bhopal cinema showtimes for this movie
      setShowsLoading(true);
      const showList = await fetchShowtimes({ movieId: rawId });
      setShows(showList);

      // Default selected date to the first available show date, or today
      if (showList.length > 0) {
        setSelectedDate(showList[0].date);
      } else {
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err: any) {
      console.error('Failed to load movie details or showtimes:', err);
      setError(err.message || 'Unable to retrieve movie details from server.');
      setLoading(false);
    } finally {
      setShowsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [rawId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090D] flex items-center justify-center">
        <LoadingState message="Fetching live movie records and showtimes..." />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4">
        <ErrorState
          title="Movie Details Not Found"
          message={error || 'Unable to locate information for this movie title.'}
          onRetry={loadData}
        />
      </div>
    );
  }

  const title = movie.title || movie.Title || 'Untitled Movie';
  const year = movie.year || movie.Year || 'N/A';
  const poster = movie.poster || movie.Poster || '';
  const backdrop = movie.backdropUrl || poster;
  const rating = movie.imdbRating && movie.imdbRating !== 'N/A' ? movie.imdbRating : null;
  const votes = movie.totalVotes || movie.imdbVotes;
  const runtime = movie.runtime || movie.Runtime;
  const plot = movie.plot || movie.Plot || 'No plot summary available.';
  const director = movie.director || movie.Director;
  const cast = movie.actors || movie.Actors;
  const genre = movie.genre || movie.Genre || (movie.genres ? movie.genres.join(', ') : 'Cinema');
  const rated = movie.rated || movie.Rated || 'PG-13';
  const language = movie.language || movie.Language;
  const country = movie.country || movie.Country;
  const isLive = movie.source === 'omdb';

  // Group shows by unique date
  const availableDates = Array.from(new Set(shows.map((s) => s.date))).sort();

  // Filter shows by selected date
  const showsForDate = shows.filter((s) => s.date === selectedDate);

  // Group shows by cinema
  const showsByCinema = showsForDate.reduce<Record<string, { cinemaName: string; cinemaId: string; shows: Show[] }>>(
    (acc, show) => {
      if (!acc[show.cinemaId]) {
        acc[show.cinemaId] = {
          cinemaName: show.cinemaName,
          cinemaId: show.cinemaId,
          shows: []
        };
      }
      acc[show.cinemaId].shows.push(show);
      return acc;
    },
    {}
  );

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      return { dayName, monthName, dayNum };
    } catch {
      return { dayName: 'DAY', monthName: '', dayNum: dateStr };
    }
  };

  const scrollToBooking = () => {
    const el = document.getElementById('bhopal-showtimes-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F5F7] pb-24">
      {/* 1. Backdrop Banner */}
      <div className="relative w-full h-[360px] md:h-[480px] overflow-hidden border-b border-[#292D38]">
        {backdrop ? (
          <img
            src={backdrop}
            alt={title}
            className="w-full h-full object-cover object-center filter brightness-50 contrast-125"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#101219] via-[#171A23] to-[#08090D]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-[#08090D]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090D] via-[#08090D]/75 to-transparent" />
      </div>

      {/* 2. Main Movie Profile Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-52 sm:w-64 shrink-0 rounded-2xl overflow-hidden border-2 border-[#292D38] shadow-2xl bg-[#171A23]">
            <img
              src={poster}
              alt={title}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Link
                to="/movies"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A1A5B3] hover:text-[#F5F5F7] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Movies</span>
              </Link>

              {/* Data Source Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                  isLive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <Database className="w-3 h-3" />
                <span>{isLive ? 'Live OMDb Record' : 'Curated Demonstration Catalog'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded bg-[#E5093F] text-white">
                {rated}
              </span>
              <span className="px-2.5 py-1 rounded bg-[#171A23] border border-[#292D38] text-[#A1A5B3]">
                {year}
              </span>
              {runtime && (
                <span className="px-2.5 py-1 rounded bg-[#171A23] border border-[#292D38] text-[#A1A5B3]">
                  {runtime}
                </span>
              )}
              {rating && (
                <span className="px-2.5 py-1 rounded bg-[#171A23] border border-[#292D38] text-amber-400 flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {rating} / 10 {votes && <span className="text-[10px] text-[#A1A5B3]">({votes} votes)</span>}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F5F7] tracking-tight font-heading">
              {title}
            </h1>

            <div className="text-xs font-semibold text-[#FF3D61]">
              {genre}
            </div>

            <p className="text-sm text-[#A1A5B3] leading-relaxed max-w-3xl">
              {plot}
            </p>

            {/* Crew & Production Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#292D38]/60 text-xs text-[#A1A5B3]">
              {director && (
                <div>
                  <span className="text-[#F5F5F7] font-bold">Director:</span> {director}
                </div>
              )}
              {cast && (
                <div>
                  <span className="text-[#F5F5F7] font-bold">Cast:</span> {cast}
                </div>
              )}
              {language && (
                <div>
                  <span className="text-[#F5F5F7] font-bold">Language:</span> {language}
                </div>
              )}
              {country && (
                <div>
                  <span className="text-[#F5F5F7] font-bold">Country:</span> {country}
                </div>
              )}
            </div>

            {/* Action Section */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToBooking}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-black shadow-xl shadow-[#E5093F]/35 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Select Showtime & Book Seats</span>
              </button>

              <PrimaryButton to="/movies" variant="secondary" size="md">
                Browse All Movies
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* 3. SHOWTIMES & CINEMA SELECTION SECTION */}
        <div id="bhopal-showtimes-section" className="pt-10 border-t border-[#292D38] space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5093F]/15 border border-[#E5093F]/30 text-[#FF3D61] text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Bhopal, Madhya Pradesh Cinema Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                Cinema Schedules & Showtimes
              </h2>
              <p className="text-xs text-[#A1A5B3]">
                Pick your preferred date and multiplex audi in Bhopal to proceed to interactive seat selection.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#A1A5B3]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Regular ₹200
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Premium ₹320
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Recliner ₹480
              </span>
            </div>
          </div>

          {/* Date Selector Tabs */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {availableDates.map((dateStr) => {
                const { dayName, monthName, dayNum } = formatDisplayDate(dateStr);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center justify-center min-w-[76px] py-3 px-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E5093F] border-[#FF3D61] text-white shadow-xl shadow-[#E5093F]/30 scale-105'
                        : 'bg-[#101219] border-[#292D38] text-[#A1A5B3] hover:border-[#A1A5B3]/40 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">{dayName}</span>
                    <span className="text-lg font-black leading-tight text-white">{dayNum}</span>
                    <span className="text-[10px] font-semibold">{monthName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cinema Venues & Showtimes List */}
          {showsLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-[#E5093F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#A1A5B3]">Checking auditorium availability...</p>
            </div>
          ) : Object.keys(showsByCinema).length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#101219] border border-[#292D38] text-center space-y-3">
              <Film className="w-8 h-8 text-[#E5093F] mx-auto" />
              <h3 className="text-base font-bold text-white">No Showtimes on Selected Date</h3>
              <p className="text-xs text-[#A1A5B3]">
                Try selecting another day above to see available screenings across Bhopal multiplexes.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.values(showsByCinema).map((cinemaGroup) => (
                <div
                  key={cinemaGroup.cinemaId}
                  className="bg-[#101219] border border-[#292D38] hover:border-[#292D38]/90 rounded-3xl p-6 transition-all shadow-xl space-y-4"
                >
                  {/* Cinema Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#292D38]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#171A23] border border-[#292D38] text-[#E5093F]">
                        <Tv className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white font-heading">
                          {cinemaGroup.cinemaName}
                        </h3>
                        <p className="text-xs text-[#A1A5B3] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#E5093F]" />
                          Bhopal, Madhya Pradesh • M-Ticket & F&B Available
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-[#A1A5B3] font-semibold">
                      {cinemaGroup.shows.length} Scheduled Screening{cinemaGroup.shows.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Showtimes Buttons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {cinemaGroup.shows.map((show) => {
                      const avail = show.availableSeatsCount;
                      const isLow = avail < 20;

                      return (
                        <button
                          key={show.id}
                          type="button"
                          onClick={() => navigate(`/shows/${show.id}/seats`)}
                          className="group p-3.5 rounded-2xl bg-[#171A23] border border-[#292D38] hover:border-[#E5093F] transition-all duration-200 text-left hover:scale-[1.02] cursor-pointer hover:shadow-lg hover:shadow-[#E5093F]/15"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base font-black text-white group-hover:text-[#FF3D61] transition-colors">
                              {show.time}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-[#A1A5B3]">
                              {show.format}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#A1A5B3] font-medium truncate mb-2">
                            {show.screenName}
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#292D38]/70">
                            <span className={isLow ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                              {avail} seats left
                            </span>
                            <span className="font-bold text-white">
                              ₹{show.pricing.regular}+
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Architecture Note */}
        <div className="pt-6 border-t border-[#292D38]">
          <div className="p-6 rounded-3xl bg-[#101219] border border-[#292D38] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F5F5F7]">
              <ShieldCheck className="w-4 h-4 text-[#E5093F]" />
              <span>Phase 3 Server-Authoritative Booking Engine</span>
            </div>
            <p className="text-xs text-[#A1A5B3] leading-relaxed">
              Movie metadata is dynamically retrieved from OMDb. Real-time showtimes, Bhopal cinema screens, and seat pricing tiers (Regular ₹200, Premium ₹320, Recliner ₹480) are authoritatively computed and locked by the Express server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
