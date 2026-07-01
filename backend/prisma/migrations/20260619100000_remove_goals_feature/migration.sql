-- The Goals (savings goals) feature has been removed entirely — it had no
-- working frontend (the only UI page that existed called an API client
-- that didn't exist and used a data shape that didn't match this table),
-- and the product decision was to remove it rather than build it out.
DROP TABLE IF EXISTS "Goal";
DROP TYPE IF EXISTS "GoalStatus";
