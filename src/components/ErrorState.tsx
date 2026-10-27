import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We were unable to load the movie information. Please try again.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-[#101219] border border-[#292D38] rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-xl">
      <div className="p-3.5 rounded-full bg-red-500/10 border border-red-500/20 text-[#FF3D61]">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-[#F5F5F7]">{title}</h3>
        <p className="text-xs text-[#A1A5B3] leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <PrimaryButton onClick={onRetry} size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Try Again
        </PrimaryButton>
      )}
    </div>
  );
};
