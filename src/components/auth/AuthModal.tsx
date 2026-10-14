import React, { useState } from 'react';
import { DEMO_PROFILES } from '../../data/mockCricketData';
import { UserProfile, UserRole } from '../../types/cricket';
import { X, Phone, Lock, ArrowRight, CheckCircle2, ShieldCheck, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim().length < 8) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 600);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const updated = [...otpCode];
    updated[index] = val;
    setOtpCode(updated);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpCode.join('');
    if (entered.length < 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: 'Alex Sterling',
        phone: phoneNumber,
        role: 'player',
        teamId: 'team_01',
        teamName: 'Victoria Thunder CC',
        bowlingStyle: 'Right-arm Fast',
        battingStyle: 'Right-hand bat',
      };
      onLoginSuccess(newUser);
      onClose();
    }, 600);
  };

  const selectDemoProfile = (profile: UserProfile) => {
    onLoginSuccess(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              PitchVision AI Authentication
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Sign In with Phone</h3>
                <p className="text-xs text-slate-400">
                  We'll send a 6-digit one-time verification passcode (OTP).
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  PHONE NUMBER
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? 'Sending SMS Code...' : 'Send 6-Digit OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Enter 6-Digit OTP</h3>
                <p className="text-xs text-slate-400">
                  Sent to <span className="font-mono text-slate-200">{phoneNumber}</span>
                </p>
              </div>

              <div className="flex justify-between gap-2">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-13 text-center bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                ))}
              </div>

              {otpError && <p className="text-xs text-rose-400 text-center">{otpError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Log In'}
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
              >
                Change Phone Number
              </button>
            </form>
          )}

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block text-center">
              Quick One-Click Demo Profiles
            </span>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectDemoProfile(p)}
                  className={`p-2 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                    currentUser.id === p.id
                      ? 'bg-emerald-500/10 border-emerald-500/80 text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 capitalize font-mono">
                    <span>{p.role}</span>
                    {currentUser.id === p.id && <span className="text-emerald-400">Active</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
