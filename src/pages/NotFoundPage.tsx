import React from 'react';
import { Film, Home, ArrowLeft } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] bg-[#08090D] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="relative inline-block">
          <div className="text-8xl font-black text-[#171A23] font-heading select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-[#E5093F]/10 border border-[#E5093F]/30 text-[#E5093F]">
              <Film className="w-10 h-10" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] font-heading">
            Page Off-Screen
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A5B3] leading-relaxed">
            The page or cinema feature you are looking for does not exist or has been relocated.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <PrimaryButton to="/" size="md" icon={<Home className="w-4 h-4" />}>
            Return to Home
          </PrimaryButton>
          <PrimaryButton to="/movies" variant="secondary" size="md">
            Browse Movies
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
