'use client';

import React, { useState } from 'react';
import { Loader2, LogIn, Mail, ShieldCheck, X } from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);

  if (!open) return null;

  const configured = isSupabaseConfigured();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setEmailAlreadyExists(false);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (err) throw err;
        // Supabase returns empty identities array when email is already registered
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setEmailAlreadyExists(true);
          return;
        }
        if (data.session) {
          onClose();
        } else {
          setVerifyEmailSent(true);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        onClose();
      }
    } catch (err) {
      const authErr = err as { status?: number; code?: string; name?: string; message?: string };
      console.error('[ResumeVix Auth Error]', {
        mode,
        email: email.trim(),
        status: authErr?.status,
        code: authErr?.code,
        name: authErr?.name,
        message: authErr?.message,
        raw: err,
      });
      const msgLower = (authErr?.message || '').toLowerCase();
      if (
        authErr?.code === 'user_already_exists' ||
        msgLower.includes('already registered') ||
        msgLower.includes('already exists')
      ) {
        setEmailAlreadyExists(true);
        return;
      }
      const details = [
        authErr?.status ? `HTTP ${authErr.status}` : '',
        authErr?.code ? `[${authErr.code}]` : '',
        authErr?.message || 'Authentication failed',
      ]
        .filter(Boolean)
        .join(' ');
      setError(details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-teal-600" />
            <h2 id="auth-modal-title" className="font-semibold text-sm">
              {mode === 'signin' ? 'Sign in to ResumeVix Cloud' : 'Create ResumeVix Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close auth modal"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {!configured ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Supabase Not Configured (Guest Mode Active)</p>
              <p>
                Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
                <code className="font-mono">.env.local</code> to enable Cloud Sync and OAuth.
              </p>
            </div>
          ) : emailAlreadyExists ? (
            <div className="py-3 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Email already exists
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  An account with <strong className="text-slate-900 dark:text-white">{email}</strong>{' '}
                  is already registered. Please sign in instead.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailAlreadyExists(false);
                    setError(null);
                  }}
                  className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
                >
                  Use Another Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailAlreadyExists(false);
                    setMode('signin');
                    setError(null);
                  }}
                  className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          ) : verifyEmailSent ? (
            <div className="py-3 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Verify your email address
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  We sent a verification link to <strong className="text-slate-900 dark:text-white">{email}</strong>.
                  Please check your inbox (and spam folder), click the link to verify your account,
                  and then return here to sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVerifyEmailSent(false);
                  setMode('signin');
                  setError(null);
                }}
                className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                  />
                </div>

                {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </form>

              <p className="text-center text-slate-500">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                  }}
                  className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
