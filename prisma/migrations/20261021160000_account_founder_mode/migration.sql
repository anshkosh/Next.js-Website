-- Preserve existing workspaces. New registrations choose their workspace via auth.
ALTER TABLE "User" ADD COLUMN "founderMode" BOOLEAN NOT NULL DEFAULT true;
