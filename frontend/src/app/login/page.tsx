'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/AuthLayout';
import { FormInput } from '@/components/FormInput';
import { PasswordToggle } from '@/components/PasswordToggle';
import { SubmitButton } from '@/components/SubmitButton';
import { Alert } from '@/components/Alert';
import { ApiError } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Display notice if redirected from successful registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessNotice('Account created successfully! Please sign in with your credentials.');
    }
  }, [searchParams]);

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // Client-side field validation
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      // On success, navigate to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setFormError('Invalid email or password. Please verify your credentials.');
        } else if (err.statusCode === 429) {
          setFormError('Too many login attempts. Please wait a few minutes before trying again.');
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('An unexpected network error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Access real-time cargo operations and shipment tracking"
      footerPrompt="Don't have an account yet?"
      footerLinkText="Create account"
      footerLinkHref="/register"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {successNotice && <Alert type="success" message={successNotice} />}
        {formError && <Alert type="error" message={formError} />}

        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="name@company.com"
          required
          autoComplete="email"
          disabled={isSubmitting}
          error={fieldErrors.email}
        />

        <FormInput
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={isSubmitting}
          error={fieldErrors.password}
          rightElement={
            <PasswordToggle
              isVisible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
            />
          }
        />

        <div className="pt-1">
          <SubmitButton isLoading={isSubmitting} loadingText="Signing in...">
            Sign In
          </SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
