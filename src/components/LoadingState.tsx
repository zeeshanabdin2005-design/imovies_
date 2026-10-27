import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading cinematic experience...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 border-3 border-[#292D38] border-t-[#E5093F] rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-[#E5093F] rounded-full animate-ping" />
        </div>
      </div>
      <p className="text-xs font-semibold text-[#A1A5B3] tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
};
