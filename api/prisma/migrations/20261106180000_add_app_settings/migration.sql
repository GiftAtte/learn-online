-- Application details (name, tagline, logo, support email): a single row with id 'app'.
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "appName" TEXT NOT NULL DEFAULT 'LearnOnline',
    "tagline" TEXT,
    "logoUrl" TEXT,
    "supportEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
