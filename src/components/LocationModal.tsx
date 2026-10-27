import React from 'react';
import { MapPin, X, Check } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

const POPULAR_CITIES = [
  { name: 'Bhopal', state: 'Madhya Pradesh', count: '4 Cinemas Active (Demo Hub)', isCurrent: true },
  { name: 'Indore', state: 'Madhya Pradesh', count: 'Coming Soon' },
  { name: 'Mumbai', state: 'Maharashtra', count: 'Coming Soon' },
  { name: 'Delhi-NCR', state: 'Delhi', count: 'Coming Soon' },
  { name: 'Bengaluru', state: 'Karnataka', count: 'Coming Soon' },
  { name: 'Pune', state: 'Maharashtra', count: 'Coming Soon' },
  { name: 'Hyderabad', state: 'Telangana', count: 'Coming Soon' },
  { name: 'Ahmedabad', state: 'Gujarat', count: 'Coming Soon' }
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#101219] border border-[#292D38] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#292D38]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#E5093F]/10 text-[#E5093F]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Select Your City</h3>
              <p className="text-xs text-[#A7A9B4]">Active demonstration schedules for Bhopal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A7A9B4] hover:text-white rounded-lg hover:bg-[#171A23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
          {POPULAR_CITIES.map((c) => {
            const isSelected = selectedCity === c.name;
            return (
              <button
                key={c.name}
                onClick={() => {
                  onSelectCity(c.name);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#E5093F]/10 border-[#E5093F] text-white'
                    : 'bg-[#171A23] border-[#292D38] hover:border-[#E5093F]/50 text-[#A7A9B4] hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-sm text-white">
                    {c.name}
                    {c.name === 'Bhopal' && (
                      <span className="text-[10px] uppercase font-bold bg-[#E5093F] text-white px-1.5 py-0.5 rounded">
                        Active Hub
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#A7A9B4]">
                    {c.state} • {c.count}
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#E5093F]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
