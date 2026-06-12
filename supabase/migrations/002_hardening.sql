-- ============================================================
-- WPR Community Board — hardening pass (002)
-- Run in the Supabase SQL Editor on a database that already ran
-- 001_init.sql. Three function bodies change; grants carry over
-- because the signatures don't.
--
--   * log_event() rate-limits per session so the grant metrics
--     stay defensible — a curl loop can't manufacture visitors.
--   * submit_post() bounds event dates to the coming year.
--   * publish_post() raises a clear error instead of Postgres's
--     bare "query returned no rows" when a post isn't pending,
--     and events now stay up through the day AFTER the event,
--     matching the documented behavior.
-- ============================================================

-- Rate-limit lookup: events by session, newest first.
create index events_session_idx on events (session_id, created_at);

-- ------------------------------------------------------------
-- log_event: 60 events per session per minute is far beyond any
-- human reader and cheap insurance for the funder numbers.
-- ------------------------------------------------------------
create or replace function log_event(
  p_event_type text,
  p_session_id text,
  p_category   post_category default null,
  p_post_id    uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent int;
begin
  select count(*) into v_recent
  from events
  where session_id = p_session_id
    and created_at > now() - interval '1 minute';

  if v_recent >= 60 then
    raise exception 'EVENT_RATE_LIMIT';
  end if;

  insert into events (event_type, category, post_id, session_id)
  values (p_event_type, p_category, p_post_id, p_session_id);
end
$$;

-- ------------------------------------------------------------
-- submit_post: events must be dated today through one year out.
-- A past event is pointless to publish; a far-future one would
-- otherwise sit on the board for years.
-- ------------------------------------------------------------
create or replace function submit_post(
  p_category      post_category,
  p_title         text,
  p_body          text,
  p_neighborhood  text,
  p_event_date    date,
  p_contact_name  text,
  p_contact_email text,
  p_show_contact  boolean,
  p_website       text default ''
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid;
  v_recent int;
begin
  if p_website <> '' then
    raise exception 'SUBMISSION_REJECTED';
  end if;

  if p_category = 'events'
     and (p_event_date < current_date or p_event_date > current_date + 365) then
    raise exception 'EVENT_DATE_RANGE: event dates must fall within the coming year';
  end if;

  select count(*) into v_recent
  from posts
  where contact_email = lower(trim(p_contact_email))
    and created_at > now() - interval '24 hours';

  if v_recent >= 3 then
    raise exception 'RATE_LIMIT: maximum 3 submissions per 24 hours';
  end if;

  insert into posts
    (category, title, body, neighborhood, event_date,
     contact_name, contact_email, show_contact)
  values
    (p_category,
     trim(p_title),
     trim(p_body),
     nullif(trim(coalesce(p_neighborhood, '')), ''),
     p_event_date,
     trim(p_contact_name),
     lower(trim(p_contact_email)),
     p_show_contact)
  returning id into v_id;

  return v_id;
end
$$;

-- ------------------------------------------------------------
-- publish_post: clear error when the post isn't pending (e.g. a
-- double-click), and event expiry lands at (event_date + 2) UTC
-- midnight — the 4:17 a.m. Central cron then takes it down the
-- morning after the day after the event, so a Saturday concert
-- stays visible through Sunday.
-- ------------------------------------------------------------
create or replace function publish_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category   post_category;
  v_event_date date;
begin
  select category, event_date
    into v_category, v_event_date
  from posts
  where id = p_id and status = 'pending';

  if not found then
    raise exception 'POST_NOT_PENDING: %', p_id;
  end if;

  update posts
  set status       = 'published',
      published_at = now(),
      expires_at   = case
        when v_category = 'events' then (v_event_date + 2)::timestamptz
        else now() + interval '21 days'
      end
  where id = p_id;
end
$$;
