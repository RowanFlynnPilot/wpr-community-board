-- ============================================================
-- WPR Community Board — dictation & language metrics (004)
-- Run after 001–003 in the Supabase SQL Editor.
--
--   * The editor can take dictation: submit_post() skips the
--     3-per-day rate limit for authenticated callers, and the
--     desk gets execute permission. Same single insert path —
--     phone-in and emailed notes land in Pending like any other
--     submission, under the neighbor's own name and email.
--   * Events learn which language the board was speaking:
--     log_event() gains p_lang, and the reporting views gain
--     Spanish/Hmong session counts — so the translation work
--     shows up as a measured outcome in the grant report.
-- ============================================================

-- ------------------------------------------------------------
-- submit_post: anonymous submissions stay rate-limited; the
-- signed-in editor is the rate limit's operator, not its target.
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

  if auth.uid() is null then
    select count(*) into v_recent
    from posts
    where contact_email = lower(trim(p_contact_email))
      and created_at > now() - interval '24 hours';

    if v_recent >= 3 then
      raise exception 'RATE_LIMIT: maximum 3 submissions per 24 hours';
    end if;
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

grant execute on function submit_post to authenticated;

-- ------------------------------------------------------------
-- Language on events. Loose shape check only — the list of
-- board languages lives in src/lib/i18n.js, not in the schema.
-- ------------------------------------------------------------
alter table events
  add column lang text check (lang is null or lang ~ '^[a-z]{2,3}$');

-- Adding a parameter changes the signature, and create-or-replace
-- would leave the old function behind as a second overload. Drop
-- and recreate; old deployed clients that omit p_lang still match
-- by named arguments and get the default.
drop function log_event(text, text, post_category, uuid);

create function log_event(
  p_event_type text,
  p_session_id text,
  p_category   post_category default null,
  p_post_id    uuid default null,
  p_lang       text default null
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

  insert into events (event_type, category, post_id, session_id, lang)
  values (p_event_type, p_category, p_post_id, p_session_id, p_lang);
end
$$;

revoke execute on function log_event from public;
grant execute on function log_event to anon, authenticated;

-- ------------------------------------------------------------
-- Reporting: sessions by board language. New columns append at
-- the end, so create-or-replace keeps the existing shape.
-- ------------------------------------------------------------
create or replace view monthly_engagement as
select
  date_trunc('month', created_at)::date as month,
  count(*) filter (where event_type = 'board_view')                    as board_views,
  count(distinct session_id) filter (where event_type = 'board_view')  as unique_visitors,
  count(distinct session_id) filter (
    where event_type = 'board_view'
      and session_id in (
        select e2.session_id from events e2
        where e2.created_at < date_trunc('month', events.created_at)
      )
  )                                                                    as returning_visitors,
  count(*) filter (where event_type = 'post_view')                     as post_views,
  count(*) filter (where event_type = 'filter_use')                    as filter_uses,
  count(*) filter (where event_type = 'submit_open')                   as submit_form_opens,
  count(*) filter (where event_type = 'submission')                    as submissions_started,
  count(*) filter (where event_type = 'share_click')                   as shares,
  count(*) filter (where event_type = 'contact_reveal')                as connections,
  count(distinct session_id) filter (
    where event_type = 'board_view' and lang = 'es'
  )                                                                    as spanish_sessions,
  count(distinct session_id) filter (
    where event_type = 'board_view' and lang = 'hmn'
  )                                                                    as hmong_sessions
from events
group by 1;

create or replace view grant_report as
select
  coalesce(e.month, p.month) as month,
  e.unique_visitors,
  e.returning_visitors,
  e.board_views,
  e.post_views,
  e.shares,
  e.connections,
  p.submissions_received,
  p.posts_published,
  p.unique_contributors,
  p.first_time_contributors,
  p.avg_hours_to_publish,
  e.spanish_sessions,
  e.hmong_sessions
from monthly_engagement e
full outer join monthly_participation p using (month)
order by month desc;
