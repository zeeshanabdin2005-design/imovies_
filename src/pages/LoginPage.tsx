import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Film, AlertCircle } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, loginAsGuest } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await loginWithEmail(email, password); navigate('/'); }
    catch (err: any) { setError(err?.code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : (err?.message || 'Sign in failed.')); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(null); setLoading(true);
    try { await loginWithGoogle(); navigate('/'); }
    catch (err: any) { setError(err?.message || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setError(null); setLoading(true);
    try { await loginAsGuest(); navigate('/'); }
    catch (err: any) { setError('Guest access is not enabled in Firebase Authentication. Enable the Anonymous sign-in provider in Firebase Console, then try again.'); }
    finally { setLoading(false); }
  };

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetMessage(null);
    try {
      const { auth } = await import('../services/firebase');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetMessage('Password reset link sent! Check your inbox.');
    } catch (e: any) {
      setResetMessage(e?.message || 'Could not send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 py-16">
      <div className="relative w-full max-w-md bg-[#101219] border border-[#292D38] rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#E5093F] blur-sm rounded-full" />
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E5093F] to-[#FF3D61] flex items-center justify-center text-white">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-wider text-[#F5F5F7]">
              I<span className="text-[#E5093F]">MOVIES</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-[#F5F5F7]">Welcome Back</h1>
          <p className="text-xs text-[#A1A5B3]">Sign in to access your tickets and profile.</p>
        </div>

        {error && (
          <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <label className="block text-[#A1A5B3] font-semibold">
            Email Address
            <div className="relative mt-1.5">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B3]" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#171A23] border border-[#292D38] focus:border-[#E5093F] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </label>

          <label className="block text-[#A1A5B3] font-semibold">
            Password
            <div className="relative mt-1.5">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B3]" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-[#171A23] border border-[#292D38] focus:border-[#E5093F] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </label>

          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => { setShowForgotModal(!showForgotModal); setResetMessage(null); }}
              className="text-[#A1A5B3] hover:text-[#E5093F] transition-colors"
            >
              Forgot password?
            </button>
            <Link to="/register" className="text-[#E5093F] hover:underline font-semibold">
              Create account
            </Link>
          </div>

          <PrimaryButton type="submit" size="md" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </PrimaryButton>
        </form>

        {showForgotModal && (
          <div className="p-4 bg-[#171A23] border border-[#292D38] rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Reset Account Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter registered email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full bg-[#101219] border border-[#292D38] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E5093F]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-xl bg-[#E5093F] text-white text-xs font-bold hover:bg-[#FF3D61] disabled:opacity-50"
                >
                  {resetLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#292D38] text-[#A1A5B3] text-xs font-semibold hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
            {resetMessage && (
              <p className="text-[11px] text-emerald-400 font-medium">{resetMessage}</p>
            )}
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-[#292D38]/60">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full rounded-xl border border-[#292D38] bg-[#171A23] hover:bg-[#202430] py-3 text-sm text-white font-medium transition-colors disabled:opacity-50"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 py-3 text-sm text-amber-300 font-medium transition-colors disabled:opacity-50"
          >
            Continue as Guest Demo
          </button>
        </div>
      </div>
    </div>
  );
};
