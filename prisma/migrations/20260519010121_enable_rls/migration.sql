-- Enable Row Level Security on every public table.
--
-- Simmer accesses its DB only via Prisma using the postgres superuser role
-- (see src/lib/prisma.ts + DATABASE_URL). The postgres role bypasses RLS by
-- default, so application traffic is unaffected. The point of this migration
-- is to lock out Supabase's PostgREST `anon` / `authenticated` roles, which
-- would otherwise be able to read every row via the Data API. No policies
-- are created on purpose — anon/authenticated should see zero rows.
--
-- Defense-in-depth only. The Data API exposure should also be turned off
-- at the project level in the Supabase dashboard.

ALTER TABLE public."User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Recipe"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CookLog"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SavedRecipe"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FriendRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Partnership"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FeedEvent"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Device"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Block"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Report"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AISummaryJob"  ENABLE ROW LEVEL SECURITY;
