-- CreateEnum
CREATE TYPE "GameResult" AS ENUM ('WHITE_WIN', 'BLACK_WIN', 'DRAW');

-- CreateEnum
CREATE TYPE "CosmeticType" AS ENUM ('BOARD', 'PIECES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rank" TEXT NOT NULL DEFAULT 'Beginner',
    "currentPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gamesPlayedInCycle" INTEGER NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "pieceSet" TEXT NOT NULL DEFAULT 'caliente',
    "boardStyle" TEXT NOT NULL DEFAULT 'canvas2',
    "pawns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "whitePlayerId" TEXT NOT NULL,
    "blackPlayerId" TEXT NOT NULL,
    "result" "GameResult",
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "openings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ecoCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_nodes" (
    "id" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "uciMove" TEXT NOT NULL,
    "sanMove" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "isMainLine" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moveNodeId" TEXT NOT NULL,
    "isLearned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cosmetics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CosmeticType" NOT NULL,
    "price" INTEGER NOT NULL,
    "asset_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cosmetics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cosmetics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cosmeticId" TEXT NOT NULL,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cosmetics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_nodes" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "bossName" TEXT NOT NULL,
    "bossElo" INTEGER NOT NULL,
    "bossAvatarUrl" TEXT NOT NULL,
    "pawnReward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_campaign_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "starsEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "user_campaign_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "moves" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "themes" TEXT NOT NULL,
    "pawnReward" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "openings_ecoCode_key" ON "openings"("ecoCode");

-- CreateIndex
CREATE INDEX "move_nodes_openingId_idx" ON "move_nodes"("openingId");

-- CreateIndex
CREATE INDEX "move_nodes_parentNodeId_idx" ON "move_nodes"("parentNodeId");

-- CreateIndex
CREATE INDEX "move_nodes_fen_idx" ON "move_nodes"("fen");

-- CreateIndex
CREATE INDEX "user_progress_userId_idx" ON "user_progress"("userId");

-- CreateIndex
CREATE INDEX "user_progress_moveNodeId_idx" ON "user_progress"("moveNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_moveNodeId_key" ON "user_progress"("userId", "moveNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_cosmetics_userId_cosmeticId_key" ON "user_cosmetics"("userId", "cosmeticId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_nodes_order_key" ON "campaign_nodes"("order");

-- CreateIndex
CREATE UNIQUE INDEX "user_campaign_progress_userId_nodeId_key" ON "user_campaign_progress"("userId", "nodeId");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_nodes" ADD CONSTRAINT "move_nodes_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_nodes" ADD CONSTRAINT "move_nodes_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "move_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_moveNodeId_fkey" FOREIGN KEY ("moveNodeId") REFERENCES "move_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cosmetics" ADD CONSTRAINT "user_cosmetics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cosmetics" ADD CONSTRAINT "user_cosmetics_cosmeticId_fkey" FOREIGN KEY ("cosmeticId") REFERENCES "cosmetics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_campaign_progress" ADD CONSTRAINT "user_campaign_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_campaign_progress" ADD CONSTRAINT "user_campaign_progress_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "campaign_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
