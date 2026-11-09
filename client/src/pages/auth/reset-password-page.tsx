import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '@/components/feedback/alert';
import { Button, FormField, PasswordInput } from '@/components/ui';
import { ApiError } from '@/core/api/error';
import { useResetPassword } from '@/core/hooks/queries/use-auth';
import { handleSubmitError } from '@/core/lib/forms';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import { resetPasswordSchema } from '@/core/schemas/auth.schemas';
import type { ResetPasswordValues } from '@/core/types/auth.types';
import { PATHS } from '@/router/paths';
import { AuthLayout } from './auth-layout';

/** Reset password: route "/reset-password?token=...", opened from the emailed link. */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const reset = useResetPassword();
  const [linkError, setLinkError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setLinkError(null);
    try {
      await reset.mutateAsync({ token, password });
      notify.success(MESSAGES.auth.passwordReset);
      navigate(PATHS.signIn, { replace: true });
    } catch (error) {
      // A bad, used or expired link is explained in the form; password problems go on the field.
      if (error instanceof ApiError && error.details.some((d) => d.path === 'token'))
        setLinkError(error.message);
      else if (error instanceof ApiError && error.status === 429) setLinkError(error.message);
      else handleSubmitError(error, form.setError);
    }
  });

  const askAgain = (
    <Link to={PATHS.forgotPassword} className="font-medium underline underline-offset-4">
      Ask for a new link
    </Link>
  );

  return (
    <AuthLayout
      title="Choose a new password"
      description="Pick something you haven’t used here before."
      footer={
        <Link
          to={PATHS.signIn}
          className="font-medium text-spruce-700 underline underline-offset-4"
        >
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <Alert tone="danger" title="This link isn’t complete">
          Open the link from your email again. {askAgain}.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {linkError && (
            <Alert tone="danger" title="Couldn’t reset your password">
              {linkError} {askAgain}.
            </Alert>
          )}
          <FormField label="New password" required error={form.formState.errors.password?.message}>
            <PasswordInput
              icon={Lock}
              placeholder="At least 8 characters, with a number"
              autoComplete="new-password"
              {...form.register('password')}
            />
          </FormField>
          <FormField
            label="Confirm new password"
            required
            error={form.formState.errors.confirmPassword?.message}
          >
            <PasswordInput
              icon={Lock}
              placeholder="Type it again"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
          </FormField>
          <Button type="submit" size="lg" loading={reset.isPending}>
            Save new password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
