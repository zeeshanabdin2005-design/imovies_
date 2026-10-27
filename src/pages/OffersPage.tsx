import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Copy, Check, Ticket, Sparkles, Percent, Calendar } from 'lucide-react';

const OFFERS = [
  {
    code: 'IMOVIES50',
    discount: '50% OFF',
    title: 'Cinematic Welcome Deal',
    description: 'Get 50% off on your movie tickets up to ₹300. Valid on all Bhopal cinema multiplexes.',
    validity: 'Valid through 2026',
    terms: 'Applicable on Regular, Premium and Recliner categories.',
    gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    border: 'border-[#E5093F]/40'
  },
  {
    code: 'FIRSTSHOW',
    discount: 'FLAT ₹100 OFF',
    title: 'First Show Debut',
    description: 'Instant flat ₹100 discount on your first booking with minimum order of 1 ticket.',
    validity: 'No minimum spend required',
    terms: 'Valid once per registered user account.',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'border-amber-500/40'
  },
  {
    code: 'WEEKEND20',
    discount: '20% OFF',
    title: 'Weekend Blockbuster Bonanza',
    description: 'Enjoy 20% discount on Friday, Saturday, and Sunday evening showtimes.',
    validity: 'Fri, Sat & Sun shows',
    terms: 'Max discount of ₹250 per booking.',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    border: 'border-purple-500/40'
  }
];

export const OffersPage: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5093F]/20 text-[#FF3D61] text-xs font-bold">
            <Percent className="w-3.5 h-3.5" />
            <span>Exclusive Promotional Discounts</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Movie Offers & Promo Codes
          </h1>

          <p className="text-sm text-[#A7A9B4] max-w-xl">
            Save on your tickets at Cinepolis DB City Mall, INOX Aashima, and PVR Aura. Copy a promo code and paste it during checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFERS.map((offer) => (
            <div
              key={offer.code}
              className={`p-6 rounded-3xl bg-[#101219] border ${offer.border} shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${offer.gradient} rounded-full blur-2xl pointer-events-none`} />

              <div className="space-y-3 relative z-10">
                <div className="inline-block px-3 py-1 rounded-full bg-[#171A23] border border-[#292D38] text-xs font-black text-white">
                  {offer.discount}
                </div>

                <h3 className="text-lg font-black text-white">{offer.title}</h3>
                <p className="text-xs text-[#A7A9B4] leading-relaxed">
                  {offer.description}
                </p>

                <div className="pt-2 text-[11px] text-[#A7A9B4]/80 space-y-1">
                  <div>• {offer.validity}</div>
                  <div>• {offer.terms}</div>
                </div>
              </div>

              {/* Code Box & Copy */}
              <div className="pt-4 border-t border-[#292D38] flex items-center justify-between gap-2 relative z-10">
                <div className="px-3 py-1.5 rounded-xl bg-[#171A23] border border-[#292D38] font-mono text-xs font-bold text-white tracking-wider">
                  {offer.code}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(offer.code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-bold transition-all shadow-md"
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-3xl bg-[#171A23] border border-[#292D38] text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Ready to Enjoy the Show?</h3>
          <p className="text-xs text-[#A7A9B4] max-w-md mx-auto">
            Choose your movie, pick your seats at your favorite Bhopal cinema, and apply your discount during checkout.
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E5093F] hover:bg-[#FF3D61] text-white text-xs font-bold shadow-lg shadow-[#E5093F]/25 transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span>Explore Movies & Book</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
