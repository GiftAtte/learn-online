-- Upload rules an administrator can change: biggest file and allowed extensions, per kind.
ALTER TABLE "AppSettings"
  ADD COLUMN "imageMaxMegabytes" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "videoMaxMegabytes" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "imageFormats" TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif']::TEXT[],
  ADD COLUMN "videoFormats" TEXT[] DEFAULT ARRAY['mp4', 'webm', 'mov']::TEXT[];
