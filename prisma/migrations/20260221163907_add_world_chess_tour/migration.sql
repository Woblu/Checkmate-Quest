-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "map_x" DOUBLE PRECISION NOT NULL,
    "map_y" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_nodes" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "botName" TEXT NOT NULL,
    "botElo" INTEGER NOT NULL,
    "botAvatarUrl" TEXT NOT NULL,
    "pawnReward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tour_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRegionId" TEXT,
    "highestRoundCleared" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tour_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_order_key" ON "regions"("order");

-- CreateIndex
CREATE INDEX "tournament_nodes_regionId_idx" ON "tournament_nodes"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tour_progress_userId_key" ON "user_tour_progress"("userId");

-- AddForeignKey
ALTER TABLE "tournament_nodes" ADD CONSTRAINT "tournament_nodes_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tour_progress" ADD CONSTRAINT "user_tour_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tour_progress" ADD CONSTRAINT "user_tour_progress_currentRegionId_fkey" FOREIGN KEY ("currentRegionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
