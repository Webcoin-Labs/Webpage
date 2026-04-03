-- Add a stable mapping from Supabase Auth users to existing app users.
ALTER TABLE "User"
ADD COLUMN "supabaseAuthId" TEXT,
ADD COLUMN "authProvider" TEXT;

CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User"("supabaseAuthId");
