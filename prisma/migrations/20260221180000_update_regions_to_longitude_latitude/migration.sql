-- Step 1: Add new longitude and latitude columns as nullable
ALTER TABLE "regions" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "regions" ADD COLUMN "latitude" DOUBLE PRECISION;

-- Step 2: Convert existing map_x/map_y to approximate longitude/latitude
-- map_x was percentage (0-100), map_y was percentage (0-100)
-- We'll set default coordinates based on region order for now
-- These will be properly set by the seed script
UPDATE "regions" SET "longitude" = -88.0817, "latitude" = 41.5250 WHERE "order" = 1; -- Joliet
UPDATE "regions" SET "longitude" = -74.0060, "latitude" = 40.7128 WHERE "order" = 2; -- New York
UPDATE "regions" SET "longitude" = -0.1276, "latitude" = 51.5074 WHERE "order" = 3; -- London
UPDATE "regions" SET "longitude" = 2.3522, "latitude" = 48.8566 WHERE "order" = 4; -- Paris
UPDATE "regions" SET "longitude" = 37.6173, "latitude" = 55.7558 WHERE "order" = 5; -- Moscow
UPDATE "regions" SET "longitude" = 116.4074, "latitude" = 39.9042 WHERE "order" = 6; -- Beijing
UPDATE "regions" SET "longitude" = 139.6503, "latitude" = 35.6762 WHERE "order" = 7; -- Tokyo
UPDATE "regions" SET "longitude" = 151.2093, "latitude" = -33.8688 WHERE "order" = 8; -- Sydney

-- Step 3: Make longitude and latitude required (NOT NULL)
ALTER TABLE "regions" ALTER COLUMN "longitude" SET NOT NULL;
ALTER TABLE "regions" ALTER COLUMN "latitude" SET NOT NULL;

-- Step 4: Drop old map_x and map_y columns
ALTER TABLE "regions" DROP COLUMN "map_x";
ALTER TABLE "regions" DROP COLUMN "map_y";
