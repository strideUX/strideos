"use client";

/**
 * PasswordResetForm - Password reset request form component
 *
 * @remarks
 * Handles password reset requests by collecting user email and sending reset links.
 * Provides comprehensive error handling for various failure scenarios.
 * Includes success state with email confirmation and retry functionality.
 * Integrates with Convex auth system for secure password reset operations.
 *
 * @example
 * ```tsx
 * <PasswordResetForm 
 *   title="Reset Password"
 *   description="Enter your email to receive a reset link"
 *   onSuccess={(email) => console.log('Reset requested for:', email)}
 *   backToLoginHref="/login"
 * />
 * ```
 */

// 1. External imports
import React, { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation } from 'convex/react';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 3. Types
interface PasswordResetFormProps {
  /** Custom title for the password reset form */
  title?: string;
  /** Custom description text for the form */
  description?: string;
  /** Callback function called on successful password reset request */
  onSuccess?: (email: string) => void;
  /** URL to return to login page */
  backToLoginHref?: string;
}

// 4. Component definition
export const PasswordResetForm = memo(function PasswordResetForm({
  title = "Reset Your Password",
  description = "Enter your email address and we'll send you a link to reset your password.",
  onSuccess,
  backToLoginHref = "/",
}: PasswordResetFormProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const requestPasswordReset = useMutation(api.auth.requestPasswordReset);

  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No complex computations needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset({ email });
      setIsSuccess(true);
      if (onSuccess) onSuccess(email);
    } catch (err) {
      let errorMessage = "Failed to send reset email. Please try again.";
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        if (message.includes("not found") || message.includes("no account")) {
          errorMessage = "No account found with this email address.";
        } else if (message.includes("recently sent") || message.includes("wait")) {
          errorMessage = "A reset link was recently sent. Please wait 30 seconds before requesting another.";
        } else if (message.includes("rate limit")) {
          errorMessage = "Too many reset attempts. Please wait a moment and try again.";
        } else if (message.includes("network") || message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (message.includes("server error") || message.includes("convex")) {
          errorMessage = "Server error. Please try again in a moment.";
        } else if (err.message.includes("reset link") || err.message.includes("account exists")) {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, requestPasswordReset, onSuccess]);

  const handleTryAgain = useCallback(() => {
    setIsSuccess(false);
    setEmail("");
    setError(null);
  }, []);

  const isFormValid = email.trim().length > 0;

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Image src="/strideos-logo.svg" alt="strideOS" width={100} height={25} className="h-10 w-auto mx-auto" />
          </div>
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-green-500">
                <CheckCircle className="h-12 w-12" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  The reset link will expire in 1 hour. If you don&apos;t see the email, please check your spam folder.
                </AlertDescription>
              </Alert>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Didn&apos;t receive the email?</p>
                <Button
                  variant="outline"
                  onClick={handleTryAgain}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Link href={backToLoginHref} className="block">
                  <Button variant="default" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Image src="/strideos-logo.svg" alt="strideOS" width={100} height={25} className="h-10 w-auto mx-auto" />
        </div>
        <Card className="w-full">
          <CardHeader>
            <Link href={backToLoginHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Link>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@company.com"
                  required
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "Sending Reset Link…" : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default PasswordResetForm;
