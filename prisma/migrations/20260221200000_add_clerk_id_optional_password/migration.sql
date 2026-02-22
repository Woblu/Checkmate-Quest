-- Add clerk_id for Clerk OAuth (nullable for email/password users)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_id" TEXT;

-- Make password optional (Clerk users don't have a password)
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Unique constraint for clerk_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_id_key" ON "users"("clerk_id");
