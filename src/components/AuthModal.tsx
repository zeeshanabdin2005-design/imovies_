import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'signin'
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginWithGoogle, loginWithEmail, signupWithEmail, loginAsGuest, resetPassword } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        await loginWithEmail(email, password);
        onClose();
      } else if (tab === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await signupWithEmail(email, password, displayName);
        onClose();
      } else if (tab === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your registered email address.');
        }
        await resetPassword(email);
        setInfo('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsGuest();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to sign in as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#101219] border border-[#292D38] rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#E5093F] blur-sm rounded-full" />

        <div className="flex items-center justify-between pb-4 border-b border-[#292D38]">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white tracking-wider">
              I<span className="text-[#E5093F]">MOVIES</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A7A9B4] hover:text-white rounded-lg hover:bg-[#171A23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#171A23] p-1 rounded-xl mt-5 mb-5 border border-[#292D38]">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); setInfo(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'signin' ? 'bg-[#E5093F] text-white shadow-md' : 'text-[#A7A9B4] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); setInfo(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'signup' ? 'bg-[#E5093F] text-white shadow-md' : 'text-[#A7A9B4] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{info}</span>
          </div>
        )}

        {/* Quick guest demo button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 font-semibold text-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Instant Guest Demo Access (One-Click)</span>
          </button>
        </div>

        {/* Google sign-in */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#171A23] hover:bg-[#1E222E] border border-[#292D38] text-white font-medium text-xs transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-[#292D38]"></div>
          <span className="px-3 text-[11px] text-[#A7A9B4] uppercase tracking-wider">Or with email</span>
          <div className="flex-1 border-t border-[#292D38]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#A7A9B4] mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A7A9B4]" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5093F]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A7A9B4] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A7A9B4]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5093F]"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#A7A9B4]">Password</label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setError(null); }}
                    className="text-xs text-[#E5093F] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A7A9B4]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5093F]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#E5093F] hover:bg-[#FF3D61] text-white font-bold text-sm shadow-lg shadow-[#E5093F]/25 transition-all mt-4"
          >
            {loading ? 'Processing...' : tab === 'signin' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        {tab === 'forgot' && (
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className="text-xs text-[#A7A9B4] hover:text-white"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
