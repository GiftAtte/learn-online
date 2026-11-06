-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- Backfill: one category per distinct text value already used by a course
INSERT INTO "Category" ("id", "name", "updatedAt")
SELECT gen_random_uuid()::text, c."category", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "category" FROM "Course") c;

-- Add the foreign key column, fill it from the old text column, then enforce NOT NULL
ALTER TABLE "Course" ADD COLUMN "categoryId" TEXT;
UPDATE "Course" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = "Course"."category");
ALTER TABLE "Course" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop the old text column and its index
DROP INDEX "Course_category_idx";
ALTER TABLE "Course" DROP COLUMN "category";

-- CreateIndex
CREATE INDEX "Course_categoryId_idx" ON "Course"("categoryId");

-- AddForeignKey (RESTRICT: a category that still has courses cannot be deleted)
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
