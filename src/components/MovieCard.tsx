import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, Eye } from 'lucide-react';

export interface MovieCardData {
  id?: string;
  imdbID?: string;
  title?: string;
  Title?: string;
  year?: string;
  Year?: string;
  posterUrl?: string;
  Poster?: string;
  rating?: string;
  imdbRating?: string;
  genres?: string[];
  Genre?: string;
}

interface MovieCardProps {
  movie: MovieCardData;
}

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const id = movie.id || movie.imdbID || '';
  const title = movie.title || movie.Title || 'Untitled Movie';
  const year = movie.year || movie.Year || '';
  const rawPoster = movie.posterUrl || movie.Poster;
  const rating = movie.rating || movie.imdbRating;
  const genre =
    movie.genres && movie.genres.length > 0
      ? movie.genres.join(', ')
      : movie.Genre || '';

  const [posterSrc, setPosterSrc] = useState(
    rawPoster && rawPoster !== 'N/A' ? rawPoster : FALLBACK_POSTER
  );

  return (
    <div className="group relative bg-[#171A23] border border-[#292D38] hover:border-[#E5093F]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#E5093F]/15 flex flex-col h-full">
      {/* Poster Container */}
      <Link
        to={`/movies/${id}`}
        className="relative aspect-[2/3] w-full overflow-hidden bg-[#101219] block"
      >
        <img
          src={posterSrc}
          alt={title}
          onError={() => setPosterSrc(FALLBACK_POSTER)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171A23] via-transparent to-black/30" />

        {/* IMDb / Rating Badge */}
        {rating && rating !== 'N/A' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-black shadow-lg">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Year Badge */}
        {year && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-[#08090D]/80 backdrop-blur-md border border-[#292D38] text-[11px] font-semibold text-[#A1A5B3]">
            {year}
          </div>
        )}

        {/* Quick action overlay on desktop */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-[2px]">
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#E5093F] text-[#F5F5F7] text-xs font-bold shadow-xl shadow-[#E5093F]/40 transform -translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-4 h-4" />
            View Details
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <Link to={`/movies/${id}`}>
            <h3 className="font-bold text-[#F5F5F7] text-sm sm:text-base line-clamp-1 group-hover:text-[#FF3D61] transition-colors">
              {title}
            </h3>
          </Link>
          {genre && (
            <p className="text-xs text-[#A1A5B3] mt-1 line-clamp-1">
              {genre}
            </p>
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-[#292D38]/60 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#A1A5B3] flex items-center gap-1">
            <Film className="w-3 h-3 text-[#E5093F]" />
            Cinema Release
          </span>
          <Link
            to={`/movies/${id}`}
            className="text-xs font-bold text-[#E5093F] hover:text-[#FF3D61] transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};
