import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Tv, Phone, CheckCircle, Film, Sparkles, Clock, Ticket, ShieldCheck } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { fetchCinemas, fetchShowtimes } from '../services/movieApi';
import type { Cinema, Show } from '../types';

export const CinemasPage: React.FC = () => {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(null);
  const [cinemaShows, setCinemaShows] = useState<Record<string, Show[]>>({});
  const [showsLoading, setShowsLoading] = useState(false);

  useEffect(() => {
    fetchCinemas()
      .then((data) => {
        setCinemas(data);
        if (data.length > 0) {
          setSelectedCinemaId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load cinemas:', err);
        setLoading(false);
      });
  }, []);

  // When selected cinema changes, load its shows
  useEffect(() => {
    if (!selectedCinemaId) return;

    setShowsLoading(true);
    fetchShowtimes({ cinemaId: selectedCinemaId })
      .then((shows) => {
        setCinemaShows((prev) => ({ ...prev, [selectedCinemaId]: shows }));
        setShowsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load cinema shows:', err);
        setShowsLoading(false);
      });
  }, [selectedCinemaId]);

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F5F7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5093F]/20 border border-[#E5093F]/40 text-[#FF3D61] text-xs font-bold font-sans">
            <MapPin className="w-3.5 h-3.5" />
            <span>Active Demonstration Region: Bhopal, Madhya Pradesh</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#F5F5F7] tracking-tight font-heading">
            Cinemas & Multiplexes
          </h1>

          <p className="text-sm text-[#A1A5B3] leading-relaxed">
            Experience state-of-the-art Dolby Atmos spatial audio, ultra-high resolution 4K Laser projection, and plush recliner seating across Bhopal's premier partner multiplexes.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#E5093F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#A1A5B3]">Loading Bhopal cinema venues...</p>
          </div>
        )}

        {/* Cinemas Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cinemas.map((cinema) => {
              const shows = cinemaShows[cinema.id] || [];
              const isSelected = selectedCinemaId === cinema.id;

              return (
                <div
                  key={cinema.id}
                  className={`bg-[#101219] border ${
                    isSelected ? 'border-[#E5093F]' : 'border-[#292D38]'
                  } hover:border-[#E5093F]/70 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between`}
                >
                  {/* Image banner */}
                  <div className="relative h-48 w-full overflow-hidden bg-[#171A23]">
                    <img
                      src={cinema.imageUrl}
                      alt={cinema.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101219] via-transparent to-black/30" />

                    {/* Rating badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{cinema.rating}</span>
                      <span className="text-[10px] text-[#A1A5B3]">({cinema.totalReviews})</span>
                    </div>

                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#08090D]/80 backdrop-blur-sm border border-[#292D38] text-[11px] font-semibold text-[#F5F5F7]">
                      <Tv className="w-3.5 h-3.5 text-[#E5093F]" />
                      <span>{cinema.screensCount} Audis / Screens</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-[#F5F5F7] font-heading">{cinema.name}</h3>
                      <p className="text-xs text-[#A1A5B3] flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="w-4 h-4 text-[#E5093F] shrink-0 mt-0.5" />
                        <span>{cinema.location}</span>
                      </p>
                      {cinema.phone && (
                        <p className="text-xs text-[#A1A5B3] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{cinema.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Amenities pills */}
                    <div>
                      <div className="text-[10px] font-bold text-[#A1A5B3] uppercase tracking-wider mb-2 font-heading">
                        Auditorium Amenities
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cinema.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="px-2.5 py-1 rounded-lg bg-[#171A23] border border-[#292D38] text-[11px] font-medium text-[#F5F5F7] flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3 text-[#E5093F]" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Screens summary */}
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[10px] font-bold text-[#A1A5B3] uppercase tracking-wider font-heading">
                        Available Audis
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {cinema.screens.map((screen) => (
                          <div
                            key={screen.id}
                            className="p-2 rounded-xl bg-[#171A23] border border-[#292D38] flex items-center justify-between"
                          >
                            <span className="font-semibold text-white truncate">{screen.name}</span>
                            <span className="text-[10px] text-[#A1A5B3] shrink-0 ml-1">
                              {screen.capacity} seats
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA & Live Showtimes preview */}
                    <div className="pt-4 border-t border-[#292D38] space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedCinemaId(cinema.id)}
                          className="text-xs font-bold text-[#FF3D61] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Viewing Showtimes Below' : 'Show Today’s Screenings'}</span>
                        </button>

                        <PrimaryButton to="/movies" size="sm" icon={<Film className="w-3.5 h-3.5" />}>
                          Browse Movies
                        </PrimaryButton>
                      </div>

                      {/* Expandable Showtimes */}
                      {isSelected && shows.length > 0 && (
                        <div className="pt-2 border-t border-[#292D38]/60 space-y-2 animate-in fade-in">
                          <div className="text-[11px] font-bold text-white flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5 text-[#E5093F]" />
                            <span>Quick Book for {shows[0]?.date}:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {shows.slice(0, 6).map((show) => (
                              <button
                                key={show.id}
                                type="button"
                                onClick={() => navigate(`/shows/${show.id}/seats`)}
                                className="px-3 py-1.5 rounded-xl bg-[#171A23] hover:bg-[#E5093F] border border-[#292D38] hover:border-[#FF3D61] text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <span>{show.time}</span>
                                <span className="text-[9px] text-[#A1A5B3] group-hover:text-white">
                                  ({show.format})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
