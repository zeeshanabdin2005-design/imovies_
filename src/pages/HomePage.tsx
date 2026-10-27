import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Eye,
  Compass,
  Ticket,
  Armchair,
  QrCode,
  Flame,
  Calendar,
  Sparkles,
  ChevronRight,
  Database
} from 'lucide-react';
import { DEMO_MOVIES, FEATURED_HERO_MOVIE } from '../data/demoMovies';
import { getCuratedMovies } from '../services/movieApi';
import type { MovieDetail } from '../types';
import { MovieCard } from '../components/MovieCard';
import { PrimaryButton } from '../components/PrimaryButton';

export const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<MovieDetail | null>(null);
  const [nowShowing, setNowShowing] = useState<any[]>(
    DEMO_MOVIES.filter((m) => m.status === 'now_showing')
  );
  const [upcoming, setUpcoming] = useState<any[]>(
    DEMO_MOVIES.filter((m) => m.status === 'upcoming')
  );
  const [source, setSource] = useState<'omdb' | 'demo'>('omdb');

  useEffect(() => {
    let active = true;
    getCuratedMovies()
      .then((data) => {
        if (!active) return;
        if (data.featured) {
          setFeatured(data.featured);
        }
        if (data.trendingNow && data.trendingNow.length > 0) {
          setNowShowing(data.trendingNow);
        }
        if (data.upcoming && data.upcoming.length > 0) {
          setUpcoming(data.upcoming);
        }
        setSource(data.source);
      })
      .catch((err) => {
        console.warn('Curated movies fallback:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const heroTitle = featured?.title || featured?.Title || FEATURED_HERO_MOVIE.title;
  const heroId = featured?.imdbID || FEATURED_HERO_MOVIE.id;
  const heroRating = featured?.imdbRating || FEATURED_HERO_MOVIE.rating;
  const heroYear = featured?.year || featured?.Year || FEATURED_HERO_MOVIE.year;
  const heroRuntime = featured?.runtime || featured?.Runtime || FEATURED_HERO_MOVIE.runtime;
  const heroGenre =
    featured?.genre ||
    featured?.Genre ||
    (featured?.genres ? featured.genres.join(', ') : FEATURED_HERO_MOVIE.genres.join(', '));
  const heroPlot = featured?.plot || featured?.Plot || FEATURED_HERO_MOVIE.description;
  const heroBackdrop =
    featured?.backdropUrl ||
    featured?.poster ||
    featured?.Poster ||
    FEATURED_HERO_MOVIE.backdropUrl ||
    FEATURED_HERO_MOVIE.posterUrl;

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F5F7]">
      {/* A. HERO SECTION */}
      <section className="relative w-full min-h-[580px] lg:min-h-[700px] flex items-end pb-16 pt-24 overflow-hidden border-b border-[#292D38]">
        {/* Large cinematic background artwork */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBackdrop}
            alt={heroTitle}
            className="w-full h-full object-cover object-center filter brightness-[0.55] contrast-125 scale-105 transform animate-in fade-in duration-1000"
          />
          {/* Dark gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-[#08090D]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090D] via-[#08090D]/80 to-transparent" />
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#08090D] to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl space-y-5">
            {/* Featured Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E5093F]/20 border border-[#E5093F]/50 text-[#FF3D61] text-xs font-bold tracking-wide uppercase shadow-lg shadow-[#E5093F]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#E5093F]" />
              <span>Featured Premiere • OMDb Integrated</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#F5F5F7] tracking-tight leading-none drop-shadow-md font-heading">
              {heroTitle}
            </h1>

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-[#A1A5B3]">
              {heroRating && (
                <div className="flex items-center gap-1 text-amber-400 bg-black/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-[#F5F5F7]">{heroRating}</span>
                  <span className="text-xs text-[#A1A5B3]">/10</span>
                </div>
              )}
              <span>•</span>
              <span>{heroYear}</span>
              {heroRuntime && (
                <>
                  <span>•</span>
                  <span>{heroRuntime}</span>
                </>
              )}
              {heroGenre && (
                <>
                  <span>•</span>
                  <span className="text-[#FF3D61] font-bold">{heroGenre}</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#A1A5B3] line-clamp-3 leading-relaxed drop-shadow">
              {heroPlot}
            </p>

            {/* Action Buttons: View Details & Explore Movies */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <PrimaryButton
                to={`/movies/${heroId}`}
                size="lg"
                icon={<Eye className="w-5 h-5" />}
              >
                View Details
              </PrimaryButton>

              <PrimaryButton
                to="/movies"
                variant="secondary"
                size="lg"
                icon={<Compass className="w-5 h-5 text-[#A1A5B3]" />}
              >
                Explore Movies
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* B. NOW SHOWING SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#292D38]/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight font-heading">
                  Now Showing
                </h2>
                <p className="text-xs text-[#A1A5B3]">
                  Current cinema releases curated via OMDb proxy
                </p>
              </div>
            </div>

            <Link
              to="/movies"
              className="text-xs font-bold text-[#E5093F] hover:text-[#FF3D61] flex items-center gap-1 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.imdbID || movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* C. UPCOMING MOVIES SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#292D38]/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight font-heading">
                  Upcoming Releases
                </h2>
                <p className="text-xs text-[#A1A5B3]">
                  Anticipated blockbusters arriving soon to theatres
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {upcoming.map((movie) => (
              <MovieCard key={movie.imdbID || movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* D. WHY IMOVIES SECTION */}
        <section className="relative rounded-3xl bg-[#101219] border border-[#292D38] p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF3D61]">
              The Next-Gen Cinema Experience
            </span>
            <h2 className="text-3xl font-black text-[#F5F5F7] tracking-tight font-heading">
              Why Choose IMovies?
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A5B3] leading-relaxed">
              Designed from the ground up for cinema purists. Enjoy seamless ticketing, real-time auditorium seating, and digital admission credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#171A23] border border-[#292D38] hover:border-[#E5093F]/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#E5093F]/10 border border-[#E5093F]/30 text-[#E5093F] flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F7] font-heading">
                Easy Booking
              </h3>
              <p className="text-xs text-[#A1A5B3] leading-relaxed">
                Effortlessly browse titles, compare cinema showtimes, and book your tickets in seconds with zero clutter.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#171A23] border border-[#292D38] hover:border-[#E5093F]/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Armchair className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F7] font-heading">
                Convenient Seat Selection
              </h3>
              <p className="text-xs text-[#A1A5B3] leading-relaxed">
                Interactive auditorium seat maps allow you to select Regular, Premium, or VIP Recliners with live visual availability.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#171A23] border border-[#292D38] hover:border-[#E5093F]/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F7] font-heading">
                Digital Tickets
              </h3>
              <p className="text-xs text-[#A1A5B3] leading-relaxed">
                Instant digital passes ready right on your phone. Save, print, or share your booking references without waiting in theatre lines.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
