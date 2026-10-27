import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Database,
  Radio,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { searchMovies } from '../services/movieApi';
import type { MovieSummary } from '../types';
import { MovieCard } from '../components/MovieCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { PrimaryButton } from '../components/PrimaryButton';

export const MoviesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(queryParam || 'interstellar');
  const [debouncedQuery, setDebouncedQuery] = useState(queryParam || 'interstellar');
  const [currentPage, setCurrentPage] = useState(isNaN(pageParam) ? 1 : pageParam);

  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'omdb' | 'demo'>('omdb');
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Filters & Sorting
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'year'>('default');

  // Race condition guard: track latest request
  const activeRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search input (450ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setCurrentPage(1);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync url params
  useEffect(() => {
    if (queryParam && queryParam !== searchInput) {
      setSearchInput(queryParam);
      setDebouncedQuery(queryParam);
    }
  }, [queryParam]);

  const executeSearch = (queryToSearch: string, pageToSearch: number) => {
    const q = queryToSearch.trim() || 'movie';

    // Cancel in-flight request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const requestId = ++activeRequestIdRef.current;

    setLoading(true);
    setError(null);

    searchMovies(q, pageToSearch, abortController.signal)
      .then((data) => {
        // Only accept response if this is the newest request
        if (requestId !== activeRequestIdRef.current) return;

        if (data.Response === 'True' && Array.isArray(data.Search)) {
          setMovies(data.Search);
          setTotalResults(parseInt(String(data.totalResults || data.Search.length), 10));
          setDataSource(data.source || 'omdb');
          setFallbackNotice(data.fallbackNotice || null);
          setError(null);
        } else {
          setMovies([]);
          setTotalResults(0);
          setDataSource(data.source || 'demo');
          setError(data.Error || 'No movies found matching your search term.');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        if (requestId !== activeRequestIdRef.current) return;

        console.error('Search error:', err);
        setError('Unable to complete search request. Please check your connection.');
        setLoading(false);
      });
  };

  useEffect(() => {
    executeSearch(debouncedQuery, currentPage);
  }, [debouncedQuery, currentPage]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setDebouncedQuery(searchInput.trim());
      setCurrentPage(1);
      setSearchParams({ q: searchInput.trim(), page: '1' });
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSearchParams({ q: debouncedQuery, page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Local filter
  const displayedMovies = movies
    .filter((m) => {
      const type = (m.type || m.Type || '').toLowerCase();
      if (selectedType === 'all') return true;
      return type.includes(selectedType.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'year') {
        const yA = parseInt((a.year || a.Year || '0').slice(0, 4), 10);
        const yB = parseInt((b.year || b.Year || '0').slice(0, 4), 10);
        return yB - yA;
      }
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(totalResults / 10));

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F5F7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header & Source Status Pill */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#292D38]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {/* Data source badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  dataSource === 'omdb'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    dataSource === 'omdb' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <Database className="w-3.5 h-3.5" />
                <span>
                  {dataSource === 'omdb' ? 'Live OMDb Catalog' : 'Demonstration Mode'}
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#F5F5F7] tracking-tight font-heading">
              Movie Discovery
            </h1>

            <p className="text-sm text-[#A1A5B3]">
              Search global titles through the secure Express backend proxy connected to OMDb.
            </p>
          </div>

          {/* Search Input & Button */}
          <form onSubmit={handleManualSearch} className="flex gap-2 w-full md:w-[420px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B3]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search movies (e.g. Inception, Batman)..."
                className="w-full bg-[#171A23] border border-[#292D38] focus:border-[#E5093F] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#F5F5F7] placeholder-[#A1A5B3] outline-none transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E5093F] hover:bg-[#FF3D61] text-[#F5F5F7] text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-md"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#101219] border border-[#292D38]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#A1A5B3] flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#E5093F]" />
              Type:
            </span>
            {['all', 'movie', 'series'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedType === type
                    ? 'bg-[#E5093F] text-white shadow-md'
                    : 'bg-[#171A23] text-[#A1A5B3] hover:text-[#F5F5F7] border border-[#292D38]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#A1A5B3] flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#171A23] border border-[#292D38] text-[#F5F5F7] text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#E5093F]"
            >
              <option value="default">Relevance</option>
              <option value="year">Newest Year</option>
            </select>
          </div>
        </div>

        {/* Fallback Notice Banner if applicable */}
        {fallbackNotice && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{fallbackNotice}</span>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#A1A5B3]">
          <div>
            Showing {displayedMovies.length} of {totalResults} titles found for{' '}
            <span className="text-[#F5F5F7]">"{debouncedQuery}"</span>
          </div>
          {totalPages > 1 && (
            <div>
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingState message={`Searching OMDb for "${debouncedQuery}"...`} />}

        {/* Error State with Retry */}
        {!loading && error && (
          <ErrorState
            title="Search Request Notice"
            message={error}
            onRetry={() => executeSearch(debouncedQuery, currentPage)}
          />
        )}

        {/* Empty State */}
        {!loading && !error && displayedMovies.length === 0 && (
          <EmptyState
            title="No Titles Found"
            message={`No movies were returned for "${debouncedQuery}". Check your spelling or try another title.`}
            actionText="Try Popular Movies"
            onAction={() => {
              setSearchInput('interstellar');
              setDebouncedQuery('interstellar');
              setCurrentPage(1);
            }}
            icon="search"
          />
        )}

        {/* Movies Grid */}
        {!loading && !error && displayedMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {displayedMovies.map((movie) => (
              <MovieCard key={movie.imdbID} movie={movie} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-8 pb-4">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171A23] border border-[#292D38] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#E5093F] text-[#A1A5B3] hover:text-[#F5F5F7] text-xs font-bold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-[#A1A5B3] px-3">
              <span className="text-[#F5F5F7] font-black">{currentPage}</span> / {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171A23] border border-[#292D38] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#E5093F] text-[#A1A5B3] hover:text-[#F5F5F7] text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
