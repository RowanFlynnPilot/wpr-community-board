// The only place categories are defined on the frontend. The database enum
// in 001_init.sql is the source of truth; this maps it to display.
export const CATEGORIES = {
  events:       { label: 'Events',          dot: '#357a71' },
  lost_found:   { label: 'Lost & Found',    dot: '#c98a12' },
  free_forsale: { label: 'Free & For Sale', dot: '#dd3333' },
  volunteer:    { label: 'Volunteer',       dot: '#557d3b' },
  shoutouts:    { label: 'Shout-Outs',      dot: '#7a5fa0' },
  milestones:   { label: 'Milestones',      dot: '#2f6f9f' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);
