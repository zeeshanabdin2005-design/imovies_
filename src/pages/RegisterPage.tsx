import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Film, AlertCircle } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [fullName,setFullName]=useState(''); const [email,setEmail]=useState('');
  const [password,setPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState('');
  const [error,setError]=useState<string|null>(null); const [loading,setLoading]=useState(false);
  const navigate=useNavigate(); const {signupWithEmail}=useAuth();
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError(null);
    if(fullName.trim().length<2){setError('Please enter your full name.');return;}
    if(password.length<8){setError('Use a password with at least 8 characters.');return;}
    if(password!==confirmPassword){setError('Passwords do not match.');return;}
    setLoading(true);try{await signupWithEmail(email,password,fullName);navigate('/');}
    catch(err:any){setError(err?.code==='auth/email-already-in-use'?'An account already exists for this email.':err?.message||'Registration failed.');}
    finally{setLoading(false);}
  };
  return <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 py-16"><div className="relative w-full max-w-md bg-[#101219] border border-[#292D38] rounded-3xl p-8 shadow-2xl space-y-6">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#E5093F] blur-sm rounded-full"/>
    <div className="text-center space-y-2"><Link to="/" className="inline-flex items-center gap-2 mb-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E5093F] to-[#FF3D61] flex items-center justify-center text-white"><Film className="w-5 h-5"/></div><span className="text-2xl font-black tracking-wider text-white">I<span className="text-[#E5093F]">MOVIES</span></span></Link><h1 className="text-2xl font-black text-white">Create Account</h1><p className="text-xs text-[#A1A5B3]">Create an account to manage your reservations.</p></div>
    {error&&<div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-2 text-red-400 text-xs"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
    <form onSubmit={submit} className="space-y-4 text-xs">
      <label className="block text-[#A1A5B3] font-semibold">Full Name<div className="relative mt-1.5"><User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"/><input required minLength={2} autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" placeholder="Your full name"/></div></label>
      <label className="block text-[#A1A5B3] font-semibold">Email Address<div className="relative mt-1.5"><Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" placeholder="you@example.com"/></div></label>
      <label className="block text-[#A1A5B3] font-semibold">Password<div className="relative mt-1.5"><Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"/><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" placeholder="At least 8 characters"/></div></label>
      <label className="block text-[#A1A5B3] font-semibold">Confirm Password<div className="relative mt-1.5"><Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"/><input required type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full bg-[#171A23] border border-[#292D38] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" placeholder="Repeat your password"/></div></label>
      <PrimaryButton type="submit" size="md" className="w-full" disabled={loading}>{loading?'Creating account…':'Create Account'}</PrimaryButton>
    </form>
    <div className="text-center text-xs text-[#A1A5B3] pt-2 border-t border-[#292D38]">Already registered? <Link to="/login" className="font-bold text-[#E5093F] hover:text-[#FF3D61]">Sign In</Link></div>
  </div></div>;
};
