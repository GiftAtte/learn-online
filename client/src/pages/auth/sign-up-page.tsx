import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button, FormField, Input } from '@/components/ui';
import { useSignUp } from '@/core/hooks/queries/use-auth';
import { signUpSchema } from '@/core/schemas/auth.schemas';
import type { SignUpValues } from '@/core/types/auth.types';
import { handleSubmitError } from '@/core/lib/forms';
import { AuthLayout } from './auth-layout';
import { PATHS } from '@/router/paths';

export default function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signUp.mutateAsync(values);
      navigate(PATHS.learner.catalog, { replace: true });
    } catch (error) {
      handleSubmitError(error, form.setError);
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      description="It takes a minute. Then pick a course and start."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={PATHS.signIn}
            className="font-medium text-spruce-700 underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormField label="Full name" required error={form.formState.errors.name?.message}>
          <Input autoComplete="name" {...form.register('name')} />
        </FormField>
        <FormField label="Email" required error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" {...form.register('email')} />
        </FormField>
        <FormField
          label="Password"
          required
          hint="At least 8 characters, with a letter and a number."
          error={form.formState.errors.password?.message}
        >
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <Button type="submit" size="lg" loading={signUp.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
