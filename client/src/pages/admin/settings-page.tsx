import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, HardDrive, Palette, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { QueryBoundary } from '@/components/feedback';
import { Page, PageSkeleton, SettingsSection } from '@/components/layout';
import { DefaultMark } from '@/components/layout/logo';
import { MediaField } from '@/components/media/media-field';
import {
  Button,
  Checkbox,
  FormField,
  Input,
  SideTabsList,
  SideTabsTrigger,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
} from '@/components/ui';
import { useGetSettings, useUpdateSettings } from '@/core/hooks/queries/use-settings';
import { useUrlParams } from '@/core/hooks/ui/use-url-params';
import { cn } from '@/core/lib/cn';
import { handleSubmitError } from '@/core/lib/forms';
import { settingsSchema } from '@/core/schemas/settings.schemas';
import type { SettingsFormValues } from '@/core/types/form.types';
import {
  IMAGE_FORMAT_CHOICES,
  MAX_IMAGE_MEGABYTES,
  MAX_VIDEO_MEGABYTES,
  VIDEO_FORMAT_CHOICES,
  type AppSettings,
} from '@/core/types/settings.types';

/** Settings sections sit under the rail, so each keeps its title above its controls. */
const StackedSection = (props: ComponentProps<typeof SettingsSection>) => (
  <SettingsSection stacked {...props} />
);

type TabId = 'application' | 'branding' | 'media' | 'access';

/** The sections: what each is called, what it covers, and which form fields live in it. */
const TABS: {
  id: TabId;
  label: string;
  hint: string;
  icon: LucideIcon;
  fields: (keyof SettingsFormValues)[];
}[] = [
  {
    id: 'application',
    label: 'Application',
    hint: 'Name, tagline and contact',
    icon: Building2,
    fields: ['appName', 'tagline', 'supportEmail'],
  },
  { id: 'branding', label: 'Branding', hint: 'Your logo', icon: Palette, fields: ['logoUrl'] },
  {
    id: 'media',
    label: 'Media',
    hint: 'Upload size and file types',
    icon: HardDrive,
    fields: ['imageMaxMegabytes', 'videoMaxMegabytes', 'imageFormats', 'videoFormats'],
  },
  {
    id: 'access',
    label: 'Access',
    hint: 'Who can create an account',
    icon: ShieldCheck,
    fields: ['allowSignups'],
  },
];

const isTab = (value: string): value is TabId => TABS.some((t) => t.id === value);

/**
 * Admin settings: route "/admin/settings" (administrators only).
 * A rail of sections on the left (Application, Branding, Media, Access) and that section's settings on
 * the right, each group titled and explained beside its controls. It is one form: change anything, in
 * any section, and a floating bar offers Save or Discard. The open section is kept in the address
 * (?tab=media), so a link goes straight to it.
 */
export default function AdminSettingsPage() {
  const settings = useGetSettings();
  return (
    <QueryBoundary
      query={settings}
      loading={
        <PageSkeleton>
          <Skeleton className="h-96 w-full" />
        </PageSkeleton>
      }
    >
      {(data) => <SettingsForm settings={data} />}
    </QueryBoundary>
  );
}

const toFormValues = (s: AppSettings): SettingsFormValues => ({
  appName: s.appName,
  tagline: s.tagline ?? '',
  logoUrl: s.logoUrl ?? '',
  supportEmail: s.supportEmail ?? '',
  imageMaxMegabytes: s.imageMaxMegabytes,
  videoMaxMegabytes: s.videoMaxMegabytes,
  imageFormats: s.imageFormats as SettingsFormValues['imageFormats'],
  videoFormats: s.videoFormats as SettingsFormValues['videoFormats'],
  allowSignups: s.allowSignups,
});

/** A row of checkboxes for choosing file types. The chosen types keep the order of `choices`. */
function FormatChoices<T extends string>({
  legend,
  choices,
  value,
  onChange,
  error,
}: {
  legend: string;
  choices: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  error?: string;
}) {
  const toggle = (choice: T, checked: boolean) =>
    onChange(choices.filter((c) => (c === choice ? checked : value.includes(c))));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[0.95rem] font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const on = value.includes(choice);
          return (
            <div
              key={choice}
              className={cn(
                'rounded-full border px-3.5 py-1 transition-colors',
                on ? 'border-spruce-700/40 bg-spruce-50' : 'border-line bg-surface',
              )}
            >
              <Checkbox
                label={choice.toUpperCase()}
                checked={on}
                onCheckedChange={(checked) => toggle(choice, checked === true)}
              />
            </div>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** The tabs that hold a field with a problem, so they can be marked. */
const tabsWithErrors = (errors: FieldErrors<SettingsFormValues>) =>
  new Set(TABS.filter((t) => t.fields.some((f) => errors[f])).map((t) => t.id));

function SettingsForm({ settings }: { settings: AppSettings }) {
  const update = useUpdateSettings();
  const [params, setParams] = useUrlParams({ tab: 'application' });
  const tab: TabId = isTab(params.tab) ? params.tab : 'application';

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(settings),
  });
  const { errors, isDirty } = form.formState;
  const flagged = tabsWithErrors(errors);
  const [name, logoUrl] = form.watch(['appName', 'logoUrl']);

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        form.reset(toFormValues(await update.mutateAsync(values)));
      } catch (error) {
        handleSubmitError(error, form.setError);
      }
    },
    // A problem in a section you can't see: jump to the first one that has it.
    (invalid) => {
      const first = TABS.find((t) => t.fields.some((f) => invalid[f]));
      if (first && first.id !== tab) setParams({ tab: first.id });
    },
  );

  return (
    <Page
      title="Settings"
      description="Manage how the application looks, what can be uploaded and who can join."
    >
      <form onSubmit={onSubmit} noValidate>
        <Tabs
          value={tab}
          onValueChange={(value) => setParams({ tab: value })}
          orientation="vertical"
          className="flex flex-col gap-6 md:flex-row md:gap-10"
        >
          <SideTabsList aria-label="Settings sections">
            {TABS.map(({ id, label, hint, icon: Icon }) => (
              <SideTabsTrigger key={id} value={id}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-sunken text-ink-soft transition-colors group-data-[state=active]/tab:bg-spruce-700 group-data-[state=active]/tab:text-white">
                  <Icon className="size-[1.1rem]" strokeWidth={1.8} aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[0.95rem] leading-tight font-semibold">{label}</span>
                  <span className="hidden text-[0.8rem] leading-snug font-normal text-ink-faint md:block">
                    {hint}
                  </span>
                </span>
                {flagged.has(id) && (
                  <span
                    className="ml-auto size-2 shrink-0 rounded-full bg-danger"
                    role="img"
                    aria-label="Has a problem"
                  />
                )}
              </SideTabsTrigger>
            ))}
          </SideTabsList>

          <div className="min-w-0 flex-1 pb-24">
            <TabsContent value="application" className="pt-0">
              <StackedSection
                title="Name and tagline"
                description="Shown in the menus, on the sign-in pages and in the browser tab."
              >
                <div className="flex flex-col gap-5">
                  <FormField label="Application name" required error={errors.appName?.message}>
                    <Input placeholder="e.g. LearnOnline" {...form.register('appName')} />
                  </FormField>
                  <FormField
                    label="Tagline"
                    hint="A short line shown on the sign-in and sign-up pages."
                    error={errors.tagline?.message}
                  >
                    <Input
                      placeholder="e.g. Courses built for people with busy days"
                      {...form.register('tagline')}
                    />
                  </FormField>
                </div>
              </StackedSection>
              <StackedSection
                title="Contact"
                description="Where people can write if they need help or want an account."
              >
                <FormField label="Support email" error={errors.supportEmail?.message}>
                  <Input
                    type="email"
                    placeholder="help@example.com"
                    {...form.register('supportEmail')}
                  />
                </FormField>
              </StackedSection>
            </TabsContent>

            <TabsContent value="branding" className="pt-0">
              <StackedSection
                title="Logo"
                description="Shown beside the name in the sidebar, headers and sign-in pages. A square image works best."
              >
                <div className="flex flex-col gap-6">
                  <FormField
                    label="Logo image"
                    hint="Leave it empty to use the default mark."
                    error={errors.logoUrl?.message}
                  >
                    <Controller
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <MediaField kind="image" value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </FormField>

                  <div className="flex flex-col gap-2.5">
                    <p className="text-[0.95rem] font-medium">How it will look</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { tone: 'border border-line bg-surface text-ink', inverted: false },
                        { tone: 'bg-spruce-900 text-white', inverted: true },
                      ].map(({ tone, inverted }) => (
                        <div
                          key={tone}
                          className={`flex items-center gap-2.5 rounded-card px-4 py-4 ${tone}`}
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="size-8 shrink-0 rounded-lg object-contain"
                            />
                          ) : (
                            <DefaultMark inverted={inverted} />
                          )}
                          <span className="truncate font-display text-xl font-semibold tracking-tight">
                            {name || 'Application name'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </StackedSection>
            </TabsContent>

            <TabsContent value="media" className="pt-0">
              <StackedSection
                title="Images"
                description="Course covers, lesson thumbnails and the logo. Files outside these rules are refused before they are sent."
              >
                <div className="flex flex-col gap-6">
                  <FormField
                    label="Largest image (MB)"
                    required
                    hint={`Up to ${MAX_IMAGE_MEGABYTES} MB.`}
                    error={errors.imageMaxMegabytes?.message}
                    className="sm:max-w-56"
                  >
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_IMAGE_MEGABYTES}
                      {...form.register('imageMaxMegabytes', { valueAsNumber: true })}
                    />
                  </FormField>
                  <Controller
                    control={form.control}
                    name="imageFormats"
                    render={({ field }) => (
                      <FormatChoices
                        legend="Allowed image types"
                        choices={IMAGE_FORMAT_CHOICES}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.imageFormats?.message}
                      />
                    )}
                  />
                </div>
              </StackedSection>
              <StackedSection
                title="Videos"
                description="Lesson videos. Large videos are uploaded straight to Cloudinary, never through this server."
              >
                <div className="flex flex-col gap-6">
                  <FormField
                    label="Largest video (MB)"
                    required
                    hint={`Up to ${MAX_VIDEO_MEGABYTES} MB. Cloudinary free plan stops at 100 MB.`}
                    error={errors.videoMaxMegabytes?.message}
                    className="sm:max-w-56"
                  >
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_VIDEO_MEGABYTES}
                      {...form.register('videoMaxMegabytes', { valueAsNumber: true })}
                    />
                  </FormField>
                  <Controller
                    control={form.control}
                    name="videoFormats"
                    render={({ field }) => (
                      <FormatChoices
                        legend="Allowed video types"
                        choices={VIDEO_FORMAT_CHOICES}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.videoFormats?.message}
                      />
                    )}
                  />
                </div>
              </StackedSection>
            </TabsContent>

            <TabsContent value="access" className="pt-0">
              <StackedSection
                title="Sign-ups"
                description="Decide whether new people can create their own account."
              >
                <Controller
                  control={form.control}
                  name="allowSignups"
                  render={({ field }) => (
                    <Switch
                      label="Allow new sign-ups"
                      description="When off, the sign-up page is closed. People who already have an account can still sign in."
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </StackedSection>
            </TabsContent>
          </div>
        </Tabs>

        {/* Appears only when something has changed, and floats over the page so it is always in reach */}
        <div aria-live="polite">
          {isDirty && (
            <div className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-xl animate-rise items-center justify-between gap-4 rounded-full bg-spruce-900 py-2.5 pr-2.5 pl-5 text-white shadow-overlay lg:inset-x-auto lg:bottom-6 lg:left-[calc(50%+8rem)] lg:-translate-x-1/2">
              <p className="flex items-center gap-2.5 text-[0.95rem]">
                <span className="size-2 rounded-full bg-pencil-500" aria-hidden />
                You have unsaved changes
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-spruce-100 hover:bg-white/10 hover:text-white"
                  disabled={update.isPending}
                  onClick={() => form.reset(toFormValues(settings))}
                >
                  Discard
                </Button>
                <Button type="submit" variant="accent" size="sm" loading={update.isPending}>
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Page>
  );
}
