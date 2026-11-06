/** The values the admin forms submit, derived from their validation rules in `core/schemas`. */
import type { z } from 'zod';
import type { categorySchema } from '@/core/schemas/category.schemas';
import type { courseSchema } from '@/core/schemas/course.schemas';
import type { lessonSchema } from '@/core/schemas/lesson.schemas';
import type { changePasswordSchema, profileSchema } from '@/core/schemas/auth.schemas';
import type { settingsSchema } from '@/core/schemas/settings.schemas';

export type CategoryFormValues = z.infer<typeof categorySchema>;

export type CourseFormValues = z.infer<typeof courseSchema>;

export type LessonFormValues = z.infer<typeof lessonSchema>;

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export type ProfileFormValues = z.infer<typeof profileSchema>;

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
