-- AlterTable: Add episodeNumber column with a default, backfill existing rows, then make it required
ALTER TABLE "Episode" ADD COLUMN "episodeNumber" INTEGER;

-- Backfill existing episodes with sequential numbers based on creation date
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "Episode"
)
UPDATE "Episode" SET "episodeNumber" = numbered.rn FROM numbered WHERE "Episode".id = numbered.id;

-- Make the column NOT NULL now that all rows have values
ALTER TABLE "Episode" ALTER COLUMN "episodeNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Episode_episodeNumber_key" ON "Episode"("episodeNumber");
