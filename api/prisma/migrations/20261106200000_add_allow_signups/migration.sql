-- Lets an administrator close public sign-ups.
ALTER TABLE "AppSettings" ADD COLUMN "allowSignups" BOOLEAN NOT NULL DEFAULT true;
