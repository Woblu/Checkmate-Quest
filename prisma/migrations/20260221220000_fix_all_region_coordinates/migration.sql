-- Fix region coordinates to match seed-tournament.ts (22 regions, correct city for each order)
-- US
UPDATE "regions" SET "longitude" = -88.081709, "latitude" = 41.525030 WHERE "order" = 1;   -- Joliet Local, Illinois
UPDATE "regions" SET "longitude" = -87.629800, "latitude" = 41.878100 WHERE "order" = 2;   -- Chicago Open
UPDATE "regions" SET "longitude" = -74.006020, "latitude" = 40.712775 WHERE "order" = 3;   -- New York Open
UPDATE "regions" SET "longitude" = -118.243685, "latitude" = 34.052235 WHERE "order" = 4;   -- Los Angeles Classic
UPDATE "regions" SET "longitude" = -80.191788, "latitude" = 25.761681 WHERE "order" = 5;    -- Miami Championship
UPDATE "regions" SET "longitude" = -122.332069, "latitude" = 47.606209 WHERE "order" = 6;  -- Seattle Masters
-- International
UPDATE "regions" SET "longitude" = -79.383178, "latitude" = 43.653226 WHERE "order" = 7;  -- Toronto Open
UPDATE "regions" SET "longitude" = -0.127758, "latitude" = 51.507351 WHERE "order" = 8;     -- London Classic
UPDATE "regions" SET "longitude" = 2.352222, "latitude" = 48.856614 WHERE "order" = 9;     -- Paris Masters
UPDATE "regions" SET "longitude" = 13.404954, "latitude" = 52.520008 WHERE "order" = 10;    -- Berlin Grand Prix
UPDATE "regions" SET "longitude" = -3.703790, "latitude" = 40.416775 WHERE "order" = 11;    -- Madrid Championship
UPDATE "regions" SET "longitude" = 12.496366, "latitude" = 41.902782 WHERE "order" = 12;    -- Rome Open
UPDATE "regions" SET "longitude" = 37.617300, "latitude" = 55.755826 WHERE "order" = 13;    -- Moscow Grand Prix
UPDATE "regions" SET "longitude" = 55.270783, "latitude" = 25.204849 WHERE "order" = 14;    -- Dubai International
UPDATE "regions" SET "longitude" = 72.877656, "latitude" = 19.076090 WHERE "order" = 15;   -- Mumbai Open
UPDATE "regions" SET "longitude" = 116.407396, "latitude" = 39.904200 WHERE "order" = 16;   -- Beijing Championship
UPDATE "regions" SET "longitude" = 121.473701, "latitude" = 31.230416 WHERE "order" = 17;   -- Shanghai Masters
UPDATE "regions" SET "longitude" = 139.650311, "latitude" = 35.676192 WHERE "order" = 18;   -- Tokyo Open
UPDATE "regions" SET "longitude" = 126.978062, "latitude" = 37.566540 WHERE "order" = 19;   -- Seoul Championship
UPDATE "regions" SET "longitude" = 151.209296, "latitude" = -33.868820 WHERE "order" = 20;  -- Sydney International
UPDATE "regions" SET "longitude" = -46.633309, "latitude" = -23.550520 WHERE "order" = 21;  -- São Paulo Open
UPDATE "regions" SET "longitude" = -58.381559, "latitude" = -34.603722 WHERE "order" = 22;  -- Buenos Aires Classic
