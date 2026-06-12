-- Development seed. Runs as postgres (bypasses RLS) — never run in production.
-- Inserts directly because seeding is the one context where derived state
-- (published_at, expires_at) is set by hand.

insert into posts
  (category, title, body, neighborhood, event_date, contact_name, contact_email,
   show_contact, status, is_pinned, published_at, expires_at)
values
  ('events',
   'Concerts on the Square kicks off Wednesday',
   'First show of the summer on the 400 Block, 6–8 p.m. Bring a lawn chair — food trucks line Third Street from 5. Free, all ages, rain location is the Grand Theater lobby.',
   'Downtown Wausau', current_date + 6,
   'Wausau Events', 'hello@example.org',
   false, 'published', true, now() - interval '2 days', (current_date + 7)::timestamptz),

  ('volunteer',
   'Hmong Wausau Festival needs setup volunteers',
   'We need 20 hands Friday evening to set up tents, tables and signage at the Eastbay Sports Complex ahead of festival weekend. Two-hour shifts, water and snacks provided, no experience needed.',
   'Eastbay Sports Complex', null,
   'Festival Committee', 'volunteer@example.org',
   true, 'published', true, now() - interval '1 day', now() + interval '20 days'),

  ('lost_found',
   'Found: gray tabby near Franklin Elementary',
   'Friendly gray tabby, no collar, has been visiting our porch on McIndoe Street since Sunday. Well fed and clearly someone''s pet. We''re keeping her safe in the garage — describe her and she''s yours.',
   'East side', null,
   'Marta K.', 'marta@example.org',
   true, 'published', false, now() - interval '3 days', now() + interval '18 days'),

  ('free_forsale',
   'Free firewood — you haul',
   'Took down two maples on Rib Mountain Drive. Roughly three cords, cut to 16-inch rounds, not split. First come, first served — it''s stacked at the end of the driveway. Gone means gone.',
   'Rib Mountain', null,
   'Dale P.', 'dale@example.org',
   false, 'published', false, now() - interval '12 hours', now() + interval '20 days'),

  ('shoutouts',
   'Thank you to the stranger at Trig''s',
   'To the man who paid for my groceries Tuesday when my card kept declining: I was having the worst week and you didn''t even let me get your name. It mattered more than you know. Paying it forward this weekend.',
   null, null,
   'Grateful on Grand Ave', 'grateful@example.org',
   false, 'published', false, now() - interval '4 days', now() + interval '17 days'),

  ('milestones',
   'Stettin couple marks 60 years',
   'Ron and Carol Zahrt of Stettin celebrate their 60th wedding anniversary this month. Married at St. Stephen''s in 1966, they raised four kids on the family dairy farm. Cards welcome — the kids are throwing them a do at the town hall.',
   'Stettin', null,
   'The Zahrt kids', 'zahrt@example.org',
   false, 'published', false, now() - interval '5 days', now() + interval '16 days'),

  ('events',
   'Kronenwetter Farmers Market opens Sunday',
   'The market opens for its 15th season Sunday, 9 a.m. to 1 p.m. at the Municipal Center. Two dozen vendors to start — produce, eggs, honey, bakery. EBT and senior vouchers accepted at the info tent.',
   'Kronenwetter', current_date + 3,
   'Market Manager', 'market@example.org',
   true, 'published', false, now() - interval '1 day', (current_date + 4)::timestamptz),

  ('free_forsale',
   'Moving sale Saturday on Andrew Avenue',
   'Everything must go: couch, kitchen table and chairs, snowblower that runs, kids'' bikes, and forty years of garage stuff. 8 a.m. to 2 p.m., 1400 block of Andrew Avenue. Early birds will be put to work.',
   'Near East side', null,
   'Lorraine B.', 'lorraine@example.org',
   false, 'published', false, now() - interval '6 hours', now() + interval '20 days'),

  ('volunteer',
   'Literacy council seeking evening tutors',
   'Marathon County Literacy Council needs volunteer tutors for adult English learners, Tuesday or Thursday evenings at the library. One hour a week, training provided, six-month commitment asked. You don''t need to speak a second language — just patience.',
   'Marathon County Public Library', null,
   'MCLC Coordinator', 'tutors@example.org',
   true, 'published', false, now() - interval '2 days', now() + interval '19 days'),

  ('lost_found',
   'Lost: keys with red carabiner, River Edge Trail',
   'Dropped somewhere between the Whitewater Park and the Bridge Street trailhead Saturday morning. Four keys and a Brewers bottle opener on a red carabiner. Reward is a six-pack and my eternal gratitude.',
   'River Edge Trail', null,
   'Tom W.', 'tom@example.org',
   true, 'published', false, now() - interval '18 hours', now() + interval '20 days');

-- One pending submission so the admin queue isn't empty on first login.
insert into posts
  (category, title, body, neighborhood, event_date, contact_name, contact_email, show_contact)
values
  ('shoutouts',
   'The crossing guard at Grant Elementary',
   'Whoever hires crossing guards: give the gentleman at Grant a raise. Rain, shine or polar vortex, he knows every kid by name and waves at every car. Our morning is better because of him.',
   'Southeast side', null,
   'A Grant parent', 'parent@example.org',
   false);
