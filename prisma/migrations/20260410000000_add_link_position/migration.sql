-- AlterTable
ALTER TABLE "Link" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill: order existing links by createdAt within each idea
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "ideaId" ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "Link"
)
UPDATE "Link" SET "position" = ordered.rn
FROM ordered
WHERE "Link"."id" = ordered."id";
