import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '@/components/feedback/alert';
import { Button, FormField, Input, PasswordInput } from '@/components/ui';
import { useSignIn } from '@/core/hooks/queries/use-auth';
import { signInSchema } from '@/core/schemas/auth.schemas';
import type { SignInValues } from '@/core/types/auth.types';
import { ApiError } from '@/core/api/error';
import { handleSubmitError } from '@/core/lib/forms';
import { MESSAGES } from '@/core/lib/messages';
import { AuthLayout } from './auth-layout';
import { homeFor, PATHS } from '@/router/paths';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
  const signIn = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await signIn.mutateAsync(values);
      // Back to the page they were sent from, otherwise to their own home (admins: the dashboard).
      navigate(from ? `${from.pathname}${from.search}` : homeFor(user.role === 'ADMIN'), {
        replace: true,
      });
    } catch (error) {
      // Wrong credentials are explained in the form; anything else becomes a toast.
      if (error instanceof ApiError && error.isUnauthorized)
        setFormError(MESSAGES.auth.invalidCredentials);
      else handleSubmitError(error, form.setError);
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue learning."
      footer={
        <>
          New here?{' '}
          <Link
            to={PATHS.signUp}
            className="font-medium text-spruce-700 underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {formError && (
          <Alert tone="danger" title="Couldn’t sign you in">
            {formError}
          </Alert>
        )}
        <FormField label="Email" required error={form.formState.errors.email?.message}>
          <Input
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            {...form.register('email')}
          />
        </FormField>
        <FormField label="Password" required error={form.formState.errors.password?.message}>
          <PasswordInput
            icon={Lock}
            placeholder="Your password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </FormField>
        <Button type="submit" size="lg" loading={signIn.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
