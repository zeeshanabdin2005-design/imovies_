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

  return <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 py-16">
    <div className="relative w-full max-w-md bg-[#101219] border border-[#292D38] rounded-3xl p-8 shadow-2xl space-y-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#E5093F] blur-sm rounded-full" />
      <div className="text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2 mb-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E5093F] to-[#FF3D61] flex items-center justify-center text-white"><Film className="w-5 h-5" /></div><span className="text-2xl font-black tracking-wider text-[#F5F5F7]">I<span className="text-[#E5093F]">MOVIES</span></span></Link>
        <h1 className="text-2xl font-black text-[#F5F5F7]">Welcome Back</h1>
        <p className="text-xs text-[#A1A5B3]">Sign in to access your tickets and profile.</p>
      </div>
      {error && <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-2 text-red-400 text-xs"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        <label className="block text-[#A1A5B3] font-semibold">Email Address<div className="relative mt-1.5"><Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B3]" /><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-[#171A23] border border-[#292D38] focus:border-[#E5093F] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" /></div></label>
        <label className="block text-[#A1A5B3] font-semibold">Password<div className="relative mt-1.5"><Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B3]" /><input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" className="w-full bg-[#171A23] border border-[#292D38] focus:border-[#E5093F] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" /></div></label>
        <div className="text-right"><Link to="/register" className="text-[#E5093F] hover:underline">Create account</Link></div>
        <PrimaryButton type="submit" size="md" className="w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</PrimaryButton>
      </form>
      <button onClick={handleGoogle} disabled={loading} className="w-full rounded-xl border border-[#292D38] bg-[#171A23] py-3 text-sm text-white disabled:opacity-50">Continue with Google</button>
      <button onClick={handleGuest} disabled={loading} className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-sm text-amber-300 disabled:opacity-50">Continue as Guest Demo</button>
      <button onClick={async()=>{const value=window.prompt('Enter your account email to receive a password reset link'); if(!value)return;setError(null);try { const { auth } = await import('../services/firebase'); const { sendPasswordResetEmail } = await import('firebase/auth'); await sendPasswordResetEmail(auth,value); window.alert('Password reset email sent if the account exists.'); } catch(e:any){setError(e?.message||'Could not send reset email.');}}} className="w-full text-xs text-[#A1A5B3] hover:text-white">Forgot password?</button>
    </div>
  </div>;
};
