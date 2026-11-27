'use client';

import React, { useState } from 'react';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const AuthGate: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setEmailAlreadyExists(false);

    try {
      if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setResetEmailSent(true);
      } else if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (err) throw err;
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setEmailAlreadyExists(true);
          return;
        }
        if (!data.session) {
          setVerifyEmailSent(true);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
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
      if (authErr?.code === 'invalid_credentials' || msgLower.includes('invalid login credentials')) {
        setError('Invalid email or password.');
        return;
      }
      setError(authErr?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src="/icon.png"
            alt="ResumeVix"
            className="w-12 h-12 rounded-xl shadow-md object-cover"
          />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'signin'
              ? 'Sign in to ResumeVix'
              : mode === 'signup'
                ? 'Create your ResumeVix account'
                : 'Reset your password'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI-Powered ATS Resume & Academic CV Studio
          </p>
        </div>

        {emailAlreadyExists ? (
          <div className="py-2 text-center space-y-4 text-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                Email already exists
              </h2>
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
                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
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
                className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        ) : verifyEmailSent ? (
          <div className="py-2 text-center space-y-4 text-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                Verify your email address
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                We sent a verification link to{' '}
                <strong className="text-slate-900 dark:text-white">{email}</strong>. Please check
                your inbox (and spam folder), click the link to verify your account, and then
                sign in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setVerifyEmailSent(false);
                setMode('signin');
                setError(null);
              }}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              Back to Sign In
            </button>
          </div>
        ) : resetEmailSent ? (
          <div className="py-2 text-center space-y-4 text-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
                Check your email
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                We sent a password reset link to{' '}
                <strong className="text-slate-900 dark:text-white">{email}</strong>. Click the link
                in your inbox to set a new password.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setResetEmailSent(false);
                setMode('signin');
                setError(null);
              }}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                        }}
                        className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span>
                  {mode === 'signin'
                    ? 'Sign In'
                    : mode === 'signup'
                      ? 'Create Account'
                      : 'Send Reset Link'}
                </span>
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
                >
                  Back to Sign In
                </button>
              ) : (
                <>
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
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
