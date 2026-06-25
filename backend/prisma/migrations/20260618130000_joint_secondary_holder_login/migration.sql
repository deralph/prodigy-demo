-- Allow a joint account's secondary holder to have their own login,
-- separate from the primary holder, instead of sharing one AuthUser.
-- Previously AuthUser.clientId was unique (one login per Client row);
-- this drops that constraint so a second AuthUser can be created for the
-- same Client once the secondary holder sets their own password via the
-- magic-link invite.

-- 1) New enum to tag which holder an AuthUser row represents.
CREATE TYPE "HolderType" AS ENUM ('PRIMARY', 'SECONDARY');

-- 2) Add the column, defaulting existing rows to PRIMARY (every AuthUser
--    created before this migration is, by definition, the sole/primary
--    login for its client).
ALTER TABLE "AuthUser" ADD COLUMN "holderType" "HolderType" NOT NULL DEFAULT 'PRIMARY';

-- 3) Drop the 1:1 uniqueness constraint on clientId so a SECONDARY
--    AuthUser can be added for the same client.
DROP INDEX IF EXISTS "AuthUser_clientId_key";

-- 4) Keep clientId indexed (no longer unique, but still looked up by FK).
CREATE INDEX "AuthUser_clientId_idx" ON "AuthUser"("clientId");
