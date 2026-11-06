import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, CreditCard, LogOut, Lock, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { SettingsSection } from '@/components/layout';
import { Avatar, Badge, Button, FormField, Input, PasswordInput } from '@/components/ui';
import {
  useChangePassword,
  useSession,
  useSignOut,
  useUpdateProfile,
} from '@/core/hooks/queries/use-auth';
import { formatDate } from '@/core/lib/format';
import { handleSubmitError } from '@/core/lib/forms';
import { changePasswordSchema, profileSchema } from '@/core/schemas/auth.schemas';
import type { ChangePasswordFormValues, ProfileFormValues } from '@/core/types/form.types';
import type { User } from '@/core/types/user.types';

/**
 * Profile: route "/profile" (everyone who is signed in, learners and administrators).
 * A chalkboard banner with who you are, then one section each for your details, your password, payment
 * details (a design preview only, nothing in it can be filled in or sent) and signing out.
 */
export default function ProfilePage() {
  const { user } = useSession();
  if (!user) return null; // the route guard has already sent guests to sign in

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <IdentityBanner user={user} />
      <div className="flex flex-col">
        <DetailsSection user={user} />
        <PasswordSection />
        <PaymentSection />
        <SignOutSection />
      </div>
    </div>
  );
}

/** The one dark moment on the page: who you are, at a glance. */
function IdentityBanner({ user }: { user: User }) {
  const admin = user.role === 'ADMIN';
  return (
    <header className="lp-hero-bg relative overflow-hidden rounded-stage text-white">
      {/* A faint chalk ruling, so the dark panel feels like a board rather than a flat block */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0, transparent 35px, white 35px, white 36px)',
        }}
      />
      <div className="relative flex flex-col items-center gap-5 px-6 py-8 text-center sm:flex-row sm:items-center sm:gap-7 sm:px-10 sm:py-10 sm:text-left">
        <Avatar
          name={user.name}
          size="xl"
          className="bg-spruce-700 text-white ring-4 ring-pencil-500/90 ring-offset-4 ring-offset-spruce-950"
        />
        <div className="flex min-w-0 flex-col items-center gap-1.5 sm:items-start">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {user.name}
          </h1>
          <p className="max-w-full truncate text-spruce-200">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge
              tone="overlay"
              icon={admin ? <ShieldCheck className="size-3.5" aria-hidden /> : undefined}
            >
              {admin ? 'Administrator' : 'Learner'}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-sm text-spruce-200">
              <CalendarDays className="size-4" aria-hidden />
              Member since {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function DetailsSection({ user }: { user: User }) {
  const update = useUpdateProfile();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      form.reset({ name: saved.name });
    } catch (error) {
      handleSubmitError(error, form.setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection
        title="Personal details"
        description="Your name appears next to your progress and on your account menu."
        footer={
          <Button type="submit" loading={update.isPending} disabled={!form.formState.isDirty}>
            Save changes
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <FormField label="Full name" required error={form.formState.errors.name?.message}>
            <Input autoComplete="name" {...form.register('name')} />
          </FormField>
          <FormField
            label="Email"
            required
            hint="This is how you sign in, so it can’t be changed here."
          >
            <Input value={user.email} readOnly disabled />
          </FormField>
        </div>
      </SettingsSection>
    </form>
  );
}

function PasswordSection() {
  const change = useChangePassword();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      form.reset();
    } catch (error) {
      handleSubmitError(error, form.setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection
        title="Password"
        description="Choose a new password. You stay signed in here, and every other device is signed out."
        footer={
          <Button type="submit" loading={change.isPending}>
            Change password
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <FormField label="Current password" required error={errors.currentPassword?.message}>
            <PasswordInput autoComplete="current-password" {...form.register('currentPassword')} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="New password"
              required
              hint="At least 8 characters, with a letter and a number."
              error={errors.newPassword?.message}
            >
              <PasswordInput autoComplete="new-password" {...form.register('newPassword')} />
            </FormField>
            <FormField
              label="Confirm new password"
              required
              error={errors.confirmPassword?.message}
            >
              <PasswordInput autoComplete="new-password" {...form.register('confirmPassword')} />
            </FormField>
          </div>
        </div>
      </SettingsSection>
    </form>
  );
}

/**
 * A design preview only: every control is disabled, there is no form to submit and nothing is stored
 * or sent. It shows where payment details will go once paid courses exist.
 */
function PaymentSection() {
  return (
    <SettingsSection
      title="Payment details"
      description="How you will pay for paid courses. Every course is free right now."
      footer={
        <>
          <Badge tone="info">Coming soon</Badge>
          <Button type="button" variant="secondary" disabled>
            Save payment details
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* A card shown as a picture of what you will add, not a working field */}
        <div
          aria-hidden
          className="relative flex h-40 max-w-sm flex-col justify-between overflow-hidden rounded-stage bg-spruce-800 p-5 text-white opacity-90"
        >
          <div className="flex items-center justify-between">
            <CreditCard className="size-7 text-pencil-400" strokeWidth={1.6} />
            <Lock className="size-4 text-spruce-300" />
          </div>
          <p className="font-display text-lg tracking-[0.2em] text-spruce-100">
            •••• •••• •••• ••••
          </p>
          <div className="flex justify-between text-xs text-spruce-300">
            <span>Name on card</span>
            <span>MM / YY</span>
          </div>
        </div>

        <FormField label="Name on card" required>
          <Input disabled placeholder="As shown on the card" />
        </FormField>
        <FormField label="Card number" required>
          <Input disabled inputMode="numeric" placeholder="1234 5678 9012 3456" />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Expiry date" required>
            <Input disabled placeholder="MM / YY" />
          </FormField>
          <FormField label="Security code" required>
            <Input disabled placeholder="CVC" />
          </FormField>
        </div>
      </div>
    </SettingsSection>
  );
}

function SignOutSection() {
  const signOut = useSignOut();
  return (
    <SettingsSection
      danger
      title="Sign out"
      description="End your session on this device. Your progress is saved."
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[0.95rem] text-ink-soft">
          You’ll need your email and password to come back.
        </p>
        <Button variant="secondary" onClick={() => void signOut()}>
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </SettingsSection>
  );
}
