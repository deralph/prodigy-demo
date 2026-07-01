-- Removing backend features that had zero frontend consumption (confirmed
-- via cross-referencing every API call in services/api.js against every
-- backend route) and, in several cases, were never even fully wired up to
-- begin with:
--   - EOD: EodModule was never registered in AppModule at all (unreachable
--     even via direct API call); runEod() never persisted an EodRun row
--     despite getHistory() reading from that table.
--   - Notification (in-app feed): the GET /notifications endpoint never
--     received the caller's userId (always returned []), and nothing
--     anywhere ever created a Notification row.
--   - LegacyNote / Statement: never read or written by any service, even
--     before the legacy/statements modules themselves were removed.
DROP TABLE IF EXISTS "EodRun";
DROP TABLE IF EXISTS "Notification";
DROP TABLE IF EXISTS "LegacyNote";
DROP TABLE IF EXISTS "Statement";
DROP TYPE IF EXISTS "EodRunStatus";
