-- Demo seed. Twelve believable Wausau notes plus two pending items so the
-- desk demos both moderation outcomes (one to approve, one to reject).
-- Dates are relative, so re-run it any time the demo board needs
-- refreshing — it first clears its own earlier rows (everything
-- @example.org), so re-runs never stack duplicates. Runs as postgres in
-- the SQL Editor (bypasses RLS); inserts directly because seeding is the
-- one context where derived state (published_at, expires_at) is set by hand.
--
-- The set is built to show the board's range: all six categories, pinned
-- Editor's picks (including a Hmong-language note — neighbors post in
-- their own language), a Spanish note, contact reveal on and off, an
-- event date, and bodies long enough to clamp. The es/hmn copy is a
-- plausible demo draft, not native-reviewed.
--
-- Every seed row uses an @example.org email, so clearing the demo before
-- real launch is one line:
--
--   delete from posts where contact_email like '%@example.org';
--
-- While seeded, monthly_participation counts these rows as submissions —
-- expected during the demo period; the line above removes them from the
-- numbers too.

delete from posts where contact_email like '%@example.org';

insert into posts
  (category, title, body, neighborhood, event_date, contact_name, contact_email,
   show_contact, status, is_pinned, published_at, expires_at)
values
  ('events',
   'Artrageous Weekend returns to the River District',
   'Wausau''s arts weekend takes over downtown Saturday and Sunday: chalk art on Third Street, the artists'' market on the 400 Block, and family workshops at the Woodson. Free admission all weekend, rain or shine.',
   'Downtown Wausau', current_date + 9,
   'River District Arts', 'arts@example.org',
   true, 'published', true, now() - interval '1 day', (current_date + 11)::timestamptz),

  ('volunteer',
   'Xav tau neeg pab faib zaub',
   'Peb cov vaj zaub muaj zaub ntau dhau lawm! Tuaj pab peb faib zaub ntsuab, dib, thiab kua txob rau cov neeg laus hauv zej zog. Hnub Saturday thaum sawv ntxov ntawm Marathon Park. Nqa hnab los.',
   'Marathon Park', null,
   'Yeeb thiab Mai', 'hmoob@example.org',
   true, 'published', true, now() - interval '2 days', now() + interval '20 days'),

  ('free_forsale',
   'Gratis: tomates y calabacitas del jardín',
   'Nuestro jardín dio más de lo que podemos comer. Hay cajas de tomates, calabacitas y pepinos en el porche de la calle Elm, cerca de St. Anne. Tomen lo que necesiten — de vecino a vecino.',
   'West side', null,
   'Familia Reyes', 'reyes@example.org',
   false, 'published', false, now() - interval '10 hours', now() + interval '20 days'),

  ('events',
   'Friday night lights: season opener tailgate',
   'The Lumberjacks open at home Friday. Boosters host a tailgate in the Thom Field lot from 5 p.m. — brats and burgers by donation, proceeds buy new practice jerseys. Wear red, bring the cowbell.',
   'Thom Field', current_date + 7,
   'Booster Club', 'boosters@example.org',
   true, 'published', false, now() - interval '18 hours', (current_date + 9)::timestamptz),

  ('free_forsale',
   'Zucchini amnesty on Randolph Street',
   'You know how this goes. The porch basket is full again every single morning: zucchini, some yellow squash, and a cabbage roughly the size of a basketball. Take them. Please. No questions asked, no zucchini accepted back under any circumstances.',
   'Near West side', null,
   'Overwhelmed on Randolph', 'garden@example.org',
   false, 'published', false, now() - interval '6 hours', now() + interval '19 days'),

  ('lost_found',
   'Found: hearing aid near the library book drop',
   'Picked up a small silver behind-the-ear hearing aid on the sidewalk by the Marathon County Public Library book drop Tuesday evening. Left it with the front desk — ask at lost and found. Hope it finds its ear.',
   'Downtown Wausau', null,
   'A library regular', 'library@example.org',
   false, 'published', false, now() - interval '3 days', now() + interval '17 days'),

  ('lost_found',
   'Lost: kid''s glasses, blue frames, Marathon Park',
   'Somewhere between the splash pad and the band shell Sunday afternoon. Blue plastic frames, pretty scratched up, absolutely essential to a certain seven-year-old. Reward: her drawing of your choice, any subject.',
   'Marathon Park', null,
   'Erin H.', 'erin@example.org',
   true, 'published', false, now() - interval '2 days', now() + interval '18 days'),

  ('shoutouts',
   'The teen who mows on Sherman Street',
   'To the young man who has mowed three yards on our block all summer — including the Hendersons'' while Bill recovers — and won''t take a dime: your folks raised you right. This whole block sees you, even if you wave us off.',
   'Sherman Street', null,
   'Sherman Street neighbors', 'sherman@example.org',
   false, 'published', false, now() - interval '4 days', now() + interval '16 days'),

  ('milestones',
   'Leola turns 100 on Labor Day',
   'Leola Prust of Weston — schoolteacher, quilter, and church organist for six decades — turns one hundred. The family asks for a card shower: one hundred cards for one hundred years. Mail them to the Weston Senior Center, attention Leola.',
   'Weston', null,
   'The Prust family', 'prust@example.org',
   false, 'published', false, now() - interval '5 days', now() + interval '16 days'),

  ('volunteer',
   'School supply drive needs sorters this week',
   'The backpack program has three tables of donated supplies to sort before school starts. Two-hour shifts at First Methodist through Thursday, coffee provided. Sixty kids walk in with a full backpack because of you.',
   'Downtown Wausau', null,
   'Backpack Program', 'backpacks@example.org',
   true, 'published', false, now() - interval '1 day', now() + interval '19 days'),

  ('events',
   'Fall rummage & bake sale at St. Stephen''s',
   'The fall sale fills the church basement: furniture, tools, winter coats, and the famous pie table — arrive early, the pies do not last. Proceeds stock the winter coat closet for anyone who needs one.',
   'Central Wausau', current_date + 13,
   'St. Stephen''s Circle', 'ststephens@example.org',
   false, 'published', false, now() - interval '2 days', (current_date + 15)::timestamptz),

  ('milestones',
   'Forty years at the mill, one last whistle',
   'Dan Kowalski clocks out for the last time Friday after forty years on the same line — trained half the floor, never missed a deer season, never once brought the same lunch twice according to his crew. Stop by the break room Friday at 2 for cake.',
   'Rothschild', null,
   'His crew', 'mill@example.org',
   false, 'published', false, now() - interval '12 hours', now() + interval '20 days');

-- Two pending submissions: one to approve, one to reject (a commercial ad
-- that breaks the house rules) — so the desk demos both outcomes.
insert into posts
  (category, title, body, neighborhood, event_date, contact_name, contact_email, show_contact)
values
  ('shoutouts',
   'The crossing guard at Grant Elementary',
   'Whoever hires crossing guards: give the gentleman at Grant a raise. Rain, shine or polar vortex, he knows every kid by name and waves at every car. Our morning is better because of him.',
   'Southeast side', null,
   'A Grant parent', 'parent@example.org',
   false),

  ('free_forsale',
   'End-of-summer gutter cleaning special',
   'Badger Gutter Pros is offering 50% off full gutter cleaning and inspection for Wausau homeowners this month only. Licensed and insured, free estimates, senior discounts. Call today — slots fill fast!',
   null, null,
   'Badger Gutter Pros', 'sales@example.org',
   true);
