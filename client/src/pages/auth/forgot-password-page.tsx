import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Alert } from '@/components/feedback/alert';
import { Button, FormField, Input } from '@/components/ui';
import { ApiError } from '@/core/api/error';
import { useForgotPassword } from '@/core/hooks/queries/use-auth';
import { handleSubmitError } from '@/core/lib/forms';
import { forgotPasswordSchema } from '@/core/schemas/auth.schemas';
import type { ForgotPasswordValues } from '@/core/types/auth.types';
import { PATHS } from '@/router/paths';
import { AuthLayout } from './auth-layout';

/** Forgot password: route "/forgot-password". Asks for an email and sends a one-time reset link. */
export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await forgot.mutateAsync(email);
      // The same message whether or not the address has an account (nobody can probe for accounts).
      setSentTo(email);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setFormError(error.message);
      else handleSubmitError(error, form.setError);
    }
  });

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we’ll send you a link to choose a new one."
      footer={
        <Link
          to={PATHS.signIn}
          className="font-medium text-spruce-700 underline underline-offset-4"
        >
          Back to sign in
        </Link>
      }
    >
      {sentTo ? (
        <Alert tone="success" title="Check your email">
          If <strong>{sentTo}</strong> has an account, a reset link is on its way. It works once and
          expires soon. Nothing there? Check your spam folder, or try again.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {formError && (
            <Alert tone="danger" title="Couldn’t send the email">
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
          <Button type="submit" size="lg" loading={forgot.isPending}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
