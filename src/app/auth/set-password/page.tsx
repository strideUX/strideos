'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isReset = searchParams.get('reset') === 'true';

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tokenValidation = useQuery(api.auth.validatePasswordResetToken, token ? { token } : 'skip');
  const completePasswordReset = useMutation(api.auth.completePasswordReset);
  const { signIn } = useAuthActions();

  const validatePassword = (value: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (value.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(value)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(value)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(value)) errors.push('One number');
    return { valid: errors.length === 0, errors };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValidation.valid && passwordsMatch && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!tokenValidation?.valid || !tokenValidation.user?.email) {
        throw new Error('Invalid token');
      }

      await signIn('password', {
        email: tokenValidation.user.email,
        password: password,
        flow: 'signUp',
      });

      await completePasswordReset({ token });
      router.push('/inbox');
    } catch (err) {
      let errorMessage = 'Failed to reset password. Please try again.';
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        if (message.includes('already been used')) {
          errorMessage = 'This password reset link has already been used. Please request a new one.';
        } else if (message.includes('expired')) {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        } else if (message.includes('invalid') || message.includes('not found')) {
          errorMessage = 'This password reset link is invalid. Please request a new one.';
        } else if (message.includes('password') && message.includes('8 characters')) {
          errorMessage = 'Password must be at least 8 characters long.';
        } else if (message.includes('account is disabled')) {
          errorMessage = 'Your account is disabled. Please contact support.';
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (message.includes('password reset is not enabled')) {
          errorMessage = 'Password reset functionality is currently unavailable. Please contact support.';
        } else if (message.includes('server error') || message.includes('request id:')) {
          errorMessage = 'A temporary server error occurred. Please try again in a few moments.';
        } else if (err.message.includes('account') || err.message.includes('password')) {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValidation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Validating invitation…</div>
      </div>
    );
  }

  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <img src="/strideos-logo.svg" alt="strideOS" className="h-10 w-auto mx-auto" />
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center text-destructive">
                {isReset ? 'Invalid Reset Link' : 'Invalid Invitation'}
              </CardTitle>
              <CardDescription className="text-center">
                {tokenValidation?.error || (isReset
                  ? 'This password reset link is invalid or has expired.'
                  : 'This invitation link is invalid or has expired.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button onClick={() => router.push('/')} className="w-full">
                  Return to Login
                </Button>
                {isReset && (
                  <Button onClick={() => router.push('/auth/reset-password')} variant="outline" className="w-full">
                    Request New Reset Link
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src="/strideos-logo.svg" alt="strideOS" className="h-10 w-auto mx-auto" />
        </div>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isReset ? 'Reset Your Password' : 'Set Your Password'}
            </CardTitle>
            <CardDescription>
              {isReset
                ? `Enter a new password for your account (${tokenValidation.user?.email})`
                : `Welcome to strideOS, ${tokenValidation.user?.name}! Please set your password to continue.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            passwordValidation.valid
                              ? 'bg-green-500'
                              : password.length >= 4
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((password.length / 8) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {passwordValidation.valid ? 'Strong' : 'Weak'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {passwordValidation.errors.map((msg, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span className="text-destructive">{msg}</span>
                        </div>
                      ))}
                      {passwordValidation.valid && (
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Password meets all requirements</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {confirmPassword.length > 0 && !passwordsMatch && (
                  <div className="flex items-center space-x-2 text-xs text-destructive">
                    <XCircle className="h-3 w-3" />
                    <span>Passwords do not match</span>
                  </div>
                )}

                {confirmPassword.length > 0 && passwordsMatch && (
                  <div className="flex items-center space-x-2 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Passwords match</span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit || isLoading}>
                {isReset ? (isLoading ? 'Resetting Password…' : 'Reset Password & Sign In') : (isLoading ? 'Setting Password…' : 'Set Password & Continue')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                {isReset ? 'Remember your password? ' : 'By setting your password, you agree to our terms of service and privacy policy.'}
                {isReset && (
                  <Link href="/" className="text-primary underline-offset-4 hover:underline">Return to login</Link>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
