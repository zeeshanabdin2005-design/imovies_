import React from 'react';
import { Film, Search } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionTo?: string;
  onAction?: () => void;
  icon?: 'film' | 'search';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No movies found',
  message = 'Try adjusting your search criteria or explore trending releases.',
  actionText,
  actionTo,
  onAction,
  icon = 'film'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-[#101219] border border-[#292D38] rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-xl">
      <div className="p-4 rounded-full bg-[#171A23] border border-[#292D38] text-[#E5093F]">
        {icon === 'search' ? <Search className="w-8 h-8" /> : <Film className="w-8 h-8" />}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-[#F5F5F7]">{title}</h3>
        <p className="text-xs text-[#A1A5B3] leading-relaxed">{message}</p>
      </div>
      {(actionText && (actionTo || onAction)) && (
        <PrimaryButton to={actionTo} onClick={onAction} size="sm">
          {actionText}
        </PrimaryButton>
      )}
    </div>
  );
};
