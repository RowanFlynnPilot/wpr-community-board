-- ============================================================
-- WPR Community Board — schema, security, analytics
-- One correct path:
--   * Readers see board_posts (view). They never touch posts.
--   * Submissions go through submit_post(). Nothing else inserts.
--   * Publishing goes through publish_post() / reject_post().
--     Those two functions are the only place derived state
--     (published_at, expires_at) is computed.
-- ============================================================

create extension if not exists pg_cron;

-- ------------------------------------------------------------
-- Types
-- ------------------------------------------------------------
create type post_category as enum (
  'events', 'lost_found', 'free_forsale', 'volunteer', 'shoutouts', 'milestones'
);

create type post_status as enum ('pending', 'published', 'rejected', 'expired');

-- ------------------------------------------------------------
-- Posts
-- ------------------------------------------------------------
create table posts (
  id            uuid primary key default gen_random_uuid(),
  category      post_category not null,
  title         text not null check (char_length(title) between 5 and 80),
  body          text not null check (char_length(body) between 20 and 600),
  neighborhood  text check (neighborhood is null or char_length(neighborhood) <= 60),
  event_date    date,
  contact_name  text not null check (char_length(contact_name) between 2 and 60),
  contact_email text not null check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  show_contact  boolean not null default false,
  status        post_status not null default 'pending',
  is_pinned     boolean not null default false,
  created_at    timestamptz not null default now(),
  published_at  timestamptz,
  expires_at    timestamptz,
  reject_reason text,
  -- Events must carry a date; nothing else may.
  constraint event_date_required check (
    (category = 'events' and event_date is not null)
    or (category <> 'events' and event_date is null)
  )
);

create index posts_board_idx on posts (status, is_pinned desc, published_at desc);
create index posts_rate_limit_idx on posts (contact_email, created_at);

alter table posts enable row level security;

-- The editor (the only authenticated user) has full access.
create policy editor_all on posts
  for all to authenticated
  using (true) with check (true);

-- Anonymous visitors get nothing on the table itself.
revoke all on table posts from anon;

-- ------------------------------------------------------------
-- Public read surface: published posts, public columns only.
-- Contact email is exposed only when the submitter opted in.
-- ------------------------------------------------------------
create view board_posts
with (security_invoker = off) as
select
  id, category, title, body, neighborhood, event_date,
  contact_name,
  case when show_contact then contact_email end as contact_email,
  is_pinned, published_at, expires_at
from posts
where status = 'published';

grant select on board_posts to anon, authenticated;

-- ------------------------------------------------------------
-- Submission path. Validates, rate-limits, inserts as pending.
-- The p_website parameter is a honeypot: humans never see the
-- field, so any non-empty value is a bot.
-- ------------------------------------------------------------
create function submit_post(
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

revoke execute on function submit_post from public;
grant execute on function submit_post to anon;

-- ------------------------------------------------------------
-- Moderation path. publish_post is the only place expiry is
-- computed: events live until the day after the event; every
-- other note lives 21 days.
-- ------------------------------------------------------------
create function publish_post(p_id uuid)
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
    into strict v_category, v_event_date
  from posts
  where id = p_id and status = 'pending';

  update posts
  set status       = 'published',
      published_at = now(),
      expires_at   = case
        when v_category = 'events' then (v_event_date + 1)::timestamptz
        else now() + interval '21 days'
      end
  where id = p_id;
end
$$;

create function reject_post(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if trim(coalesce(p_reason, '')) = '' then
    raise exception 'REJECT_REASON_REQUIRED';
  end if;

  update posts
  set status = 'rejected', reject_reason = trim(p_reason)
  where id = p_id and status = 'pending';

  if not found then
    raise exception 'POST_NOT_PENDING: %', p_id;
  end if;
end
$$;

revoke execute on function publish_post from public;
revoke execute on function reject_post from public;
grant execute on function publish_post to authenticated;
grant execute on function reject_post to authenticated;

-- ------------------------------------------------------------
-- Analytics: first-party interaction events. No PII — the
-- session id is a random 16-char identifier the browser keeps
-- in localStorage. Nothing here identifies a person.
-- ------------------------------------------------------------
create table events (
  id         bigint generated always as identity primary key,
  event_type text not null check (event_type in (
    'board_view', 'post_view', 'filter_use', 'submit_open',
    'submission', 'share_click', 'contact_reveal'
  )),
  category   post_category,
  post_id    uuid,
  session_id text not null check (char_length(session_id) = 16),
  created_at timestamptz not null default now()
);

create index events_month_idx on events (created_at, event_type);

alter table events enable row level security;

create policy editor_read_events on events
  for select to authenticated
  using (true);

revoke all on table events from anon;

create function log_event(
  p_event_type text,
  p_session_id text,
  p_category   post_category default null,
  p_post_id    uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into events (event_type, category, post_id, session_id)
  values (p_event_type, p_category, p_post_id, p_session_id);
end
$$;

revoke execute on function log_event from public;
grant execute on function log_event to anon, authenticated;

-- ------------------------------------------------------------
-- Reporting views. grant_report is the table that goes in the
-- funder report: one row per month, every number defined in
-- the Measurement & Evaluation section of the proposal.
-- ------------------------------------------------------------
create view monthly_engagement as
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
  count(*) filter (where event_type = 'contact_reveal')                as connections
from events
group by 1;

create view monthly_participation as
select
  date_trunc('month', p.created_at)::date as month,
  count(*)                                                  as submissions_received,
  count(*) filter (where p.status in ('published','expired')) as posts_published,
  count(distinct p.contact_email)                           as unique_contributors,
  count(distinct p.contact_email) filter (
    where not exists (
      select 1 from posts prior
      where prior.contact_email = p.contact_email
        and prior.created_at < date_trunc('month', p.created_at)
    )
  )                                                         as first_time_contributors,
  round(avg(extract(epoch from p.published_at - p.created_at) / 3600.0)
        filter (where p.published_at is not null), 1)        as avg_hours_to_publish
from posts p
group by 1;

create view grant_report as
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
  p.avg_hours_to_publish
from monthly_engagement e
full outer join monthly_participation p using (month)
order by month desc;

-- Reporting views are for the editor and grant reports only.
revoke all on monthly_engagement, monthly_participation, grant_report from anon;
grant select on monthly_engagement, monthly_participation, grant_report to authenticated;

-- ------------------------------------------------------------
-- Expiry. Runs daily at 4:17am Central (9:17 UTC). The board
-- never shows a stale garage sale.
-- ------------------------------------------------------------
select cron.schedule(
  'expire-board-posts',
  '17 9 * * *',
  $$update posts set status = 'expired' where status = 'published' and expires_at < now()$$
);
