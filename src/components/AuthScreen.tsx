/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  User, 
  Users, 
  Landmark, 
  Award, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Check, 
  HelpCircle,
  Clock,
  Unlock,
  Building,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { UserProfile, Coach, Team, UserRole } from '../types';

interface AuthScreenProps {
  users: UserProfile[];
  coaches: Coach[];
  teams: Team[];
  useFirestore?: boolean;
  onToggleFirestore?: (val: boolean) => void;
  onLogin: (profile: UserProfile, staySignedIn: boolean) => void;
  onLoginCredentials?: (email: string, password: string, staySignedIn: boolean) => Promise<void>;
  onGoogleSignIn?: (
    role?: UserRole, 
    customName?: string, 
    payload?: { coachId?: string; teamId?: string; associationName?: string }
  ) => Promise<void>;
  onPlayerSignup: (fields: { 
    name: string; 
    email: string; 
    password?: string;
    coachId?: string; 
    staySignedIn: boolean; 
  }) => Promise<void>;
  onCoachSignup: (fields: { 
    name: string; 
    email: string; 
    password?: string;
    teamId?: string; 
    staySignedIn: boolean; 
  }) => Promise<void>;
  onAssociationSignup: (fields: { 
    name: string; 
    email: string; 
    password?: string;
    associationName: string; 
    staySignedIn: boolean; 
  }) => Promise<void>;
  onParentSignup: (fields: {
    parentName: string;
    parentEmail: string;
    parentPassword?: string;
    playerName: string;
    playerEmail: string;
    coachId?: string;
    staySignedIn: boolean;
  }) => Promise<void>;
}

export default function AuthScreen({
  users,
  coaches,
  teams,
  useFirestore = true,
  onToggleFirestore,
  onLogin,
  onLoginCredentials,
  onGoogleSignIn,
  onPlayerSignup,
  onCoachSignup,
  onAssociationSignup,
  onParentSignup
}: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // General Inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); // Empty by default for authentic entries
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('player');

  // Player Signup Inputs
  const [playerCoachId, setPlayerCoachId] = useState('');

  // Coach Signup Inputs
  const [coachTeamId, setCoachTeamId] = useState('');

  // Association Signup Inputs
  const [associationName, setAssociationName] = useState('');

  // Parent Signup Inputs
  const [parentPlayerName, setParentPlayerName] = useState('');
  const [parentPlayerEmail, setParentPlayerEmail] = useState('');
  const [parentAutoEmail, setParentAutoEmail] = useState(true);
  const [parentCoachId, setParentCoachId] = useState('');

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter an email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      if (onLoginCredentials) {
        // True credentials login with Firebase Auth
        await onLoginCredentials(email.trim(), password, staySignedIn);
      } else {
        // Fallback or offline demo matching
        const match = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (match) {
          onLogin(match, staySignedIn);
        } else {
          setErrorMsg(`No registered account found with email "${email}". Please sign up below.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate user.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Firebase auth protection requires passwords to be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (selectedRole === 'player') {
        await onPlayerSignup({
          name,
          email: email.trim(),
          password,
          coachId: playerCoachId || undefined,
          staySignedIn
        });
      } else if (selectedRole === 'coach') {
        await onCoachSignup({
          name,
          email: email.trim(),
          password,
          teamId: coachTeamId || undefined,
          staySignedIn
        });
      } else if (selectedRole === 'association') {
        if (!associationName) {
          setErrorMsg('Please enter your Association / Governing Body name.');
          setLoading(false);
          return;
        }
        await onAssociationSignup({
          name,
          email: email.trim(),
          password,
          associationName,
          staySignedIn
        });
      } else if (selectedRole === 'parent') {
        if (!parentPlayerName) {
          setErrorMsg("Please enter your athlete's full name.");
          setLoading(false);
          return;
        }
        if (!parentCoachId) {
          setErrorMsg("Please select a Coach to connect your youth athlete to.");
          setLoading(false);
          return;
        }

        let resolvedPlayerEmail = parentPlayerEmail.trim();
        if (parentAutoEmail) {
          resolvedPlayerEmail = parentPlayerName.trim().toLowerCase().replace(/\s+/g, '-') + '@pdp.com';
        } else if (!resolvedPlayerEmail) {
          setErrorMsg("Please provide your athlete's email address or check the 'Auto-generate' option.");
          setLoading(false);
          return;
        }

        await onParentSignup({
          parentName: name,
          parentEmail: email.trim(),
          parentPassword: password,
          playerName: parentPlayerName,
          playerEmail: resolvedPlayerEmail,
          coachId: parentCoachId || undefined,
          staySignedIn
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register account credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (onGoogleSignIn) {
        if (isSignUp) {
          // If they selected association and didn't input associationName, prompt
          if (selectedRole === 'association' && !associationName) {
            setErrorMsg('Please enter your Association/League Name first.');
            setLoading(false);
            return;
          }
          await onGoogleSignIn(
            selectedRole,
            name || undefined,
            {
              coachId: selectedRole === 'player' ? playerCoachId || undefined : undefined,
              teamId: selectedRole === 'coach' ? coachTeamId || undefined : undefined,
              associationName: selectedRole === 'association' ? associationName || undefined : undefined,
            }
          );
        } else {
          // Standard login
          await onGoogleSignIn();
        }
      } else {
        setErrorMsg('Google Sign-In is not initialized on this install.');
      }
    } catch (err: any) {
      console.error("Google authentication error:", err);
      setErrorMsg(err.message || 'Google account authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Welcome & Navigation Header */}
      <header className="bg-slate-900/60 border-b border-slate-850 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.ibb.co/gb9535YK/Untitled-design-6.png" 
              alt="Echelon Logo" 
              className="h-10 w-10 object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <span className="text-sm font-bold text-slate-100 tracking-tight font-sans">
              Player Development Portal
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
              setTimeout(() => {
                const headerEl = document.getElementById('welcome-back-header');
                if (headerEl) {
                  headerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 50);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#00BBFF] text-white text-xs font-bold rounded-full transition hover:opacity-90 cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5 text-white" />
            <span>LOG IN</span>
          </button>
        </div>
      </header>

      {/* Main Landing & Authentication Screen */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/5 grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          
          {/* Absolute Glowing Elements */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
  
        {/* Input/Interactive Panel (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-8 z-10">
          
          {/* Top Form Selection Toggles */}
          <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-850 relative">
            <button
              onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-sans transition-colors flex items-center justify-center gap-1.5 relative z-10 ${
                !isSignUp 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {!isSignUp && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#00BBFF] rounded-xl shadow shadow-[#00BBFF]/20 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Unlock className="w-3.5 h-3.5" />
              Sign Into Account
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-sans transition-colors flex items-center justify-center gap-1.5 relative z-10 ${
                isSignUp 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSignUp && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#00BBFF] rounded-xl shadow shadow-[#00BBFF]/20 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Users className="w-3.5 h-3.5" />
              Register Profile
            </button>
          </div>

          {/* Database Mode Switcher Indicator */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-850 rounded-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg border shrink-0 ${
                useFirestore 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse'
              }`}>
                {useFirestore ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div className="text-left min-w-0">
                <div className="text-[11px] font-sans font-bold text-slate-200 truncate">
                  {useFirestore ? 'Firebase Cloud Connected' : 'Offline Sandbox Active'}
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                  {useFirestore ? 'Enterprise Sync Engine Active' : 'Zero-Network Local Storage Mode'}
                </div>
              </div>
            </div>
            {onToggleFirestore && (
              <button
                type="button"
                onClick={() => {
                  onToggleFirestore(!useFirestore);
                  setErrorMsg('');
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold border transition shrink-0 ${
                  useFirestore 
                    ? 'bg-indigo-950/40 text-indigo-400 border-indigo-850 hover:bg-indigo-900/40 hover:border-indigo-750' 
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-850 hover:bg-emerald-900/40 hover:border-emerald-750'
                }`}
              >
                {useFirestore ? 'Go Offline' : 'Go Online'}
              </button>
            )}
          </div>

          {/* Primary Interactive Form Wrapper */}
          <div className="flex-1 flex flex-col justify-center py-4">
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs space-y-3">
                <div className="font-mono font-bold flex items-center gap-1.5">
                  <span className="text-sm">⚠</span> {errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('failed') || errorMsg.toLowerCase().includes('fetch') ? 'Database Network Fault' : 'Verification Alert'}
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('failed') || errorMsg.toLowerCase().includes('fetch')
                    ? "Your local development or network container sandbox is shielding external requests, blocking contact with Google Identity servers (auth/network-request-failed). You can completely work around this by going into 'Offline Sandbox' mode above, and complete all signups locally in-browser!"
                    : errorMsg}
                </p>
                {(errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('failed') || errorMsg.toLowerCase().includes('fetch') || errorMsg.toLowerCase().includes('firebase')) && onToggleFirestore && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleFirestore(false);
                      setErrorMsg('');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center block uppercase tracking-wider font-mono animate-pulse"
                  >
                    Bypass to Local Offline Sandbox Mode
                  </button>
                )}
              </div>
            )}

            {!isSignUp ? (
              /* SIGN IN FORM */
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 id="welcome-back-header" className="text-lg font-bold text-slate-100">Welcome Back</h3>
                  <p className="text-xs text-slate-400 font-sans">Insert your credentials to enter the dashboard</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">EMAIL ADDRESS</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. jjenkins@coaches.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-650 outline-none focus:border-[#00BBFF] focus:ring-1 focus:ring-[#00BBFF] transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">PASSWORD</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-100 placeholder:text-slate-650 outline-none focus:border-[#00BBFF] focus:ring-1 focus:ring-[#00BBFF] transition-colors font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keep Signed In toggle option */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staySignedIn}
                      onChange={(e) => setStaySignedIn(e.target.checked)}
                      className="rounded border-[#00BBFF] text-[#00BBFF] bg-slate-950 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400">Stay signed in on this device</span>
                  </label>
                  <a href="#forgot" className="text-xs text-[#00BBFF] hover:underline font-semibold">Forgot?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00BBFF] hover:bg-[#009be0] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-full transition duration-200 mt-4 flex items-center justify-center gap-1.5 shadow"
                >
                  {loading ? 'Authenticating Secures...' : 'Access Dashboard Portal'}
                  {!loading && <ArrowRight className="h-4 w-4 text-white" />}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-mono uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500">Or Access Instant</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={loading}
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                     <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.275 1.564-1.88 4.6-6.887 4.6-4.33 0-7.859-3.58-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.13C18.31 1.785 15.54 1 12.24 1A11 11 0 0 0 1.24 12a11 11 0 0 0 11 11c11.53 0 12.24-8.1 12.24-11.23 0-.754-.08-1.32-.18-1.785z"
                    />
                  </svg>
                  Google Unified Sign-In
                </button>
              </form>
            ) : (
              /* SIGN UP FORM (MULTIPATH ROLE SELECTION) */
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-100">Create Sporting Account</h3>
                  <p className="text-xs text-slate-400">Join the PDP to participate in athletic operations</p>
                </div>

                {/* Role Selector Grid */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">My Sporting Level / Role</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedRole('player'); setErrorMsg(''); }}
                      className={`py-3 px-2 rounded-xl text-xs font-bold font-sans border transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedRole === 'player'
                          ? 'bg-[#1d75ff]/15 text-[#1d75ff] border-[#1d75ff]/30 shadow-sm shadow-[#1d75ff]/10'
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>Player</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedRole('coach'); setErrorMsg(''); }}
                      className={`py-3 px-2 rounded-xl text-xs font-bold font-sans border transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedRole === 'coach'
                          ? 'bg-[#1d75ff]/15 text-[#1d75ff] border-[#1d75ff]/30 shadow-sm shadow-[#1d75ff]/10'
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <Award className="h-4 w-4" />
                      <span>Coach</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedRole('association'); setErrorMsg(''); }}
                      className={`py-3 px-2 rounded-xl text-xs font-bold font-sans border transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedRole === 'association'
                          ? 'bg-[#1d75ff]/15 text-[#1d75ff] border-[#1d75ff]/30 shadow-sm shadow-[#1d75ff]/10'
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <Landmark className="h-4 w-4" />
                      <span>Association</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedRole('parent'); setErrorMsg(''); }}
                      className={`py-3 px-2 rounded-xl text-xs font-bold font-sans border transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedRole === 'parent'
                          ? 'bg-[#1d75ff]/15 text-[#1d75ff] border-[#1d75ff]/30 shadow-sm shadow-[#1d75ff]/10'
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <Users className="h-4 w-4 text-indigo-400" />
                      <span>Parent</span>
                    </button>
                  </div>
                </div>

                {/* General Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      {selectedRole === 'parent' ? 'PARENT FULL NAME' : 'YOUR FULL NAME'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={selectedRole === 'parent' ? "e.g. Maria Rivera" : "e.g. Alex Rivera"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-[#00BBFF] focus:ring-1 focus:ring-[#00BBFF] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      {selectedRole === 'parent' ? 'PARENT EMAIL ADDRESS' : 'EMAIL ADDRESS'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={selectedRole === 'parent' ? "e.g. mrivera@gmail.com" : "e.g. arivera@gmail.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-[#00BBFF] focus:ring-1 focus:ring-[#00BBFF] transition-colors"
                    />
                  </div>
                </div>

                {/* Choose Password Field */}
                <div className="pt-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">CHOOSE PASSWORD</label>
                  <div className="relative font-sans">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 characters for Firebase security"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-100 placeholder:text-slate-650 outline-none focus:border-[#00BBFF] focus:ring-1 focus:ring-[#00BBFF] transition-colors font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* ROLE PATH 1: Player selection logic */}
                {selectedRole === 'player' && (
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-405 uppercase tracking-wider mb-1">
                        SELECT YOUR COACH (auto-links Team & Organization)
                      </label>
                      <select
                        value={playerCoachId}
                        onChange={(e) => setPlayerCoachId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2.5 outline-none font-sans"
                      >
                        <option value="">-- No Coach selected (Sign up as Unlisted) --</option>
                        {coaches.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    {playerCoachId === '' ? (
                      <p className="text-[11px] text-amber-400/80 italic font-medium leading-normal">
                        * You don't have a coach on this system? No worries. You'll sign in as an <b>Unlisted Athlete</b> and can link/create later in profile settings!
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-400/90 font-medium leading-normal">
                        ✓ Excellent. Team affiliation and parent club information will populate automatically from your coach's registration details!
                      </p>
                    )}
                  </div>
                )}

                {/* ROLE PATH 2: Coach selection logic */}
                {selectedRole === 'coach' && (
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-405 uppercase tracking-wider mb-1">
                        SELECT ASSIGNED TEAM
                      </label>
                      <select
                        value={coachTeamId}
                        onChange={(e) => setCoachTeamId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2.5 outline-none font-sans"
                      >
                        <option value="">-- My team is not listed (I will formulate it inside) --</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {coachTeamId === '' ? (
                      <p className="text-[11px] text-amber-400/80 italic font-medium leading-normal">
                        * No worries if your team is not listed. Upon entering the app, we will guide you to <b>Formulate a new Team, create or select a Club, and integrate your Governing Association</b> instantly!
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-400/90 font-medium leading-normal">
                        ✓ Your coach credentials will instantly bind to this competitive soccer/basketball squad roster!
                      </p>
                    )}
                  </div>
                )}

                {/* ROLE PATH 3: Association creation logic */}
                {selectedRole === 'association' && (
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 font-sans">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-405 uppercase tracking-wider mb-1">
                        NAME OF YOUR ATHLETIC ASSOCIATION / LEAGUE
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Washington Premier Athletic Association"
                        value={associationName}
                        onChange={(e) => setAssociationName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-150 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      As an Association President/Manager account, you will have first-class privileges to <b>Register Clubs, delegate Teams, and verified Coaches</b> inside your corporate governance dashboard.
                    </p>
                  </div>
                )}

                {/* ROLE PATH 4: Parent registration logic */}
                {selectedRole === 'parent' && (
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                    <span className="text-[10px] uppercase font-mono text-[#00BBFF] tracking-wider block font-bold">
                      Youth Athlete Profile Linkage
                    </span>

                    {/* Athlete Name */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                        ATHLETE'S FULL NAME
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Rivera"
                        value={parentPlayerName}
                        onChange={(e) => setParentPlayerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-150 outline-none font-sans"
                      />
                    </div>

                    {/* Auto generated toggle */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={parentAutoEmail}
                          onChange={(e) => setParentAutoEmail(e.target.checked)}
                          className="rounded border-[#00BBFF] text-[#00BBFF] bg-slate-900 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                        />
                        <span className="text-xs text-slate-350">Auto-generate professional player email (@pdp.com)</span>
                      </label>

                      {parentAutoEmail ? (
                        <div className="bg-slate-900/60 p-2 border border-slate-800 rounded-lg">
                          <p className="text-[10px] text-slate-500 font-mono">Auto Email Broadcast Address:</p>
                          <p className="text-xs text-emerald-400 font-mono font-bold truncate mt-0.5">
                            {parentPlayerName 
                              ? `${parentPlayerName.trim().toLowerCase().replace(/\s+/g, '-')}@pdp.com` 
                              : '[athletes-name]@pdp.com'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                            ATHLETE'S CUSTOM EMAIL ADDRESS
                          </label>
                          <input
                            type="email"
                            required={!parentAutoEmail}
                            placeholder="e.g. alexrivera@gmail.com"
                            value={parentPlayerEmail}
                            onChange={(e) => setParentPlayerEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-150 outline-none font-sans"
                          />
                        </div>
                      )}
                    </div>

                    {/* Select Coach */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                        SELECT SQUAD COACH
                      </label>
                      <select
                        value={parentCoachId}
                        onChange={(e) => setParentCoachId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2.5 outline-none font-sans"
                      >
                        <option value="">-- Click to select Team Coach --</option>
                        {coaches.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
                      This will instantly allocate account authorization profiles for both yourself and your player on the performance registry, bound to the specified squad roster.
                    </p>
                  </div>
                )}

                {/* Stay signed in checkbox */}
                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staySignedIn}
                      onChange={(e) => setStaySignedIn(e.target.checked)}
                      className="rounded border-slate-800 text-[#00BBFF] bg-slate-950 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400">Remember my session and auto-login next time</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00BBFF] hover:bg-[#009be0] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-full transition duration-200 mt-4 flex items-center justify-center gap-1.5 shadow-lg shadow-[#00BBFF]/15"
                >
                  {loading ? 'Registering Credentials...' : 'Register Profile & Log In'}
                  {!loading && <ArrowRight className="h-4 w-4 text-white" />}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-mono uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500">Or Instant Setup</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={loading}
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.275 1.564-1.88 4.6-6.887 4.6-4.33 0-7.859-3.58-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.13C18.31 1.785 15.54 1 12.24 1A11 11 0 0 0 1.24 12a11 11 0 0 0 11 11c11.53 0 12.24-8.1 12.24-11.23 0-.754-.08-1.32-.18-1.785z"
                    />
                  </svg>
                  Google Unified Sign-Up ({selectedRole.toUpperCase()})
                </button>
              </form>
            )}

          </div>

        </div>

        {/* Brand/Pitch Side Panel (4 cols) - Positioned below Interactive on mobile, right on desktop */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 p-8 sm:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-6 z-10">
            <div className="space-y-4 pt-4 sm:pt-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-sans tracking-tight leading-tight text-center">
                Unlock Athletic Excellence.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                The Player Development Portal is a comprehensive platform built for athletes, coaches, clubs, and associations who are serious about long-term performance growth. Athletes can track GPS-recorded runs, complete structured classroom sessions in strength and conditioning, injury prevention, mental resilience, yoga, and recovery — all in one place. Monitor daily sleep, hydration, and personal goals, while your coach gains full visibility into your progress and can assign training schedules, sessions, and distance targets tailored to your development stage. Whether you're an athlete building your foundation or a coach managing an entire squad, PDP gives every level of your organisation the tools to develop with purpose and perform with confidence.
              </p>
            </div>
          </div>

          {/* Core Taxonomic Indicators */}
          <div className="space-y-4 pt-8 sm:pt-0 z-10">
            <p className="text-[10px] font-mono text-slate-500 text-center lg:text-left mt-4 pt-4 border-t border-slate-800/50">
              Player Development Portal — 2026 Sports Performance Engine
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
