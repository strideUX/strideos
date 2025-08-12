'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthActions } from '@convex-dev/auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

export default function SignInForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'password_reset_success') {
      setSuccessMessage('Password reset successful! You can now sign in with your new password.');
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn('password', {
        email,
        password,
        flow: 'signIn',
      });
      router.push('/inbox');
    } catch (err) {
      if (err instanceof Error && err.message.includes('InvalidAccountId')) {
        try {
          await signIn('password', {
            email,
            password,
            flow: 'signUp',
          });
          router.push('/inbox');
        } catch (signUpErr) {
          let errorMessage = 'Authentication failed';
          if (signUpErr instanceof Error) {
            if (signUpErr.message.includes('InvalidSecret')) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (signUpErr.message.includes('password')) {
              errorMessage = 'Incorrect password. Please try again or reset your password.';
            } else {
              errorMessage = signUpErr.message;
            }
          }
          setError(errorMessage);
        }
      } else {
        let errorMessage = 'Sign in failed';
        if (err instanceof Error) {
          if (err.message.includes('InvalidSecret')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (err.message.includes('password')) {
            errorMessage = 'Incorrect password. Please try again or reset your password.';
          } else if (err.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Image src="/strideos-logo.svg" alt="strideOS" width={100} height={25} className="h-10 w-auto mx-auto mb-2" />
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {successMessage && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/reset-password" className="text-sm text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} strideOS</span>
        </div>
      </div>
    </div>
  );
} 