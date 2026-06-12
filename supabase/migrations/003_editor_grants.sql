-- ============================================================
-- WPR Community Board — editor grants (003)
-- Run after 001 (002 not required first). Newer Supabase
-- projects no longer grant table privileges to the
-- authenticated role automatically, and an RLS policy is not a
-- grant — without these, the desk fails with "permission
-- denied for table posts".
--
-- Deliberately narrower than the editor_all policy: the desk
-- only ever reads and updates. Inserts arrive via submit_post()
-- and nothing deletes rows — expiry is a status change.
-- ============================================================

grant select, update on table posts to authenticated;

-- Matches the editor_read_events policy in 001.
grant select on table events to authenticated;
