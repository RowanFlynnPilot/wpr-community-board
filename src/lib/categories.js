// The only place categories are defined on the frontend. The database enum
// in 001_init.sql is the source of truth; this maps it to display. Labels
// carry all three board languages (see src/lib/i18n.js for the toggle).
export const CATEGORIES = {
  events: {
    dot: '#357a71',
    labels: { en: 'Events', es: 'Eventos', hmn: 'Cov koob tsheej' },
  },
  lost_found: {
    dot: '#c98a12',
    labels: { en: 'Lost & Found', es: 'Perdido y encontrado', hmn: 'Ploj thiab pom' },
  },
  free_forsale: {
    dot: '#dd3333',
    labels: { en: 'Free & For Sale', es: 'Gratis y en venta', hmn: 'Pub dawb thiab muag' },
  },
  volunteer: {
    dot: '#557d3b',
    labels: { en: 'Volunteer', es: 'Voluntariado', hmn: 'Pab dawb' },
  },
  shoutouts: {
    dot: '#7a5fa0',
    labels: { en: 'Shout-Outs', es: 'Agradecimientos', hmn: 'Ua tsaug' },
  },
  milestones: {
    dot: '#2f6f9f',
    labels: { en: 'Milestones', es: 'Hitos', hmn: 'Hnub tseem ceeb' },
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export function categoryLabel(key, lang = 'en') {
  return CATEGORIES[key].labels[lang] || CATEGORIES[key].labels.en;
}
