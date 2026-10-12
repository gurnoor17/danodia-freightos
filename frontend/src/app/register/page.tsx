'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/AuthLayout';
import { FormInput } from '@/components/FormInput';
import { PasswordToggle } from '@/components/PasswordToggle';
import { SubmitButton } from '@/components/SubmitButton';
import { Alert } from '@/components/Alert';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // Client-side field validation
  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      errors.name = 'Full name cannot exceed 100 characters';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register(name.trim(), email.trim(), password);
      // On successful registration, navigate to /login with registered notice
      router.push('/login?registered=true');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setFormError('An account with this email address already exists. Please sign in instead.');
        } else if (err.errors && err.errors.length > 0) {
          setFormError(err.errors.join('. '));
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
      title="Create your account"
      subtitle="Register to access the Danodia FreightOS logistics platform"
      footerPrompt="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert type="error" message={formError} />}

        <FormInput
          id="name"
          name="name"
          label="Full name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="e.g. Captain Alex Danodia"
          required
          autoComplete="name"
          disabled={isSubmitting}
          error={fieldErrors.name}
        />

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
            if (confirmPassword && e.target.value !== confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            }
          }}
          placeholder="At least 8 characters"
          helperText="Min. 8 characters"
          required
          autoComplete="new-password"
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

        <FormInput
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          placeholder="Re-enter your password"
          required
          autoComplete="new-password"
          disabled={isSubmitting}
          error={fieldErrors.confirmPassword}
          rightElement={
            <PasswordToggle
              isVisible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isSubmitting}
            />
          }
        />

        <div className="pt-2">
          <SubmitButton isLoading={isSubmitting} loadingText="Creating account...">
            Create Account
          </SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
}
