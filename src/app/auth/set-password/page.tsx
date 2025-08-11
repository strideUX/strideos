'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate token
  const tokenValidation = useQuery(api.auth.validatePasswordResetToken, 
    token ? { token } : 'skip'
  );

  // Password reset mutations
  const completePasswordReset = useMutation(api.auth.completePasswordReset);
  const { signIn } = useAuthActions();

  // Password validation
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("One number");
    return { valid: errors.length === 0, errors };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValidation.valid && passwordsMatch && password.length > 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!tokenValidation?.valid || !tokenValidation.user?.email) {
        throw new Error('Invalid token');
      }

      // Use our custom approach: try to sign in with new password using signUp flow
      // This should work for existing users who are resetting passwords
      await signIn('password', {
        email: tokenValidation.user.email,
        password: password,
        flow: 'signUp', // Use signUp flow to set new credentials for existing user
      });
      
      // Mark the reset token as used
      await completePasswordReset({ token });
      
      // Redirect to inbox
      router.push('/inbox');
    } catch (err) {
      // Parse error messages to show user-friendly versions
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
        } else if (message.includes('uncaught error')) {
          errorMessage = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
        } else {
          // Use the actual error message if it's user-friendly, otherwise use generic message
          errorMessage = err.message.includes('account') || err.message.includes('password') 
            ? err.message 
            : 'Failed to reset password. Please try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (tokenValidation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
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
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                Return to Login
              </Button>
              {isReset && (
                <Button 
                  onClick={() => router.push('/auth/reset-password')} 
                  variant="outline"
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
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
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{error}</p>
                    {error.includes('new password reset link') && (
                      <p className="text-sm">
                        <a 
                          href="/auth/reset-password" 
                          className="text-blue-600 hover:text-blue-500 underline"
                        >
                          Click here to request a new reset link
                        </a>
                      </p>
                    )}
                  </div>
                </AlertDescription>
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
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordValidation.valid
                            ? 'bg-green-500'
                            : password.length >= 4
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min((password.length / 8) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {passwordValidation.valid ? 'Strong' : 'Weak'}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {passwordValidation.errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">{error}</span>
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
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {confirmPassword.length > 0 && !passwordsMatch && (
                <div className="flex items-center space-x-2 text-xs text-red-600">
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

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isLoading}
            >
              {isLoading 
                ? (isReset ? 'Resetting Password...' : 'Setting Password...')
                : (isReset ? 'Reset Password & Sign In' : 'Set Password & Continue')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {isReset 
                ? 'Remember your password? '
                : 'By setting your password, you agree to our terms of service and privacy policy.'}
              {isReset && (
                <a href="/" className="text-blue-600 hover:text-blue-500">
                  Return to login
                </a>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
