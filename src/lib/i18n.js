import { createContext, useContext } from 'react';

// The public board speaks three languages; the editor's desk stays English.
// No i18n library — one strings object per language, a React context, and a
// footer toggle. The stamp (APPROVED / RECEIVED) stays English everywhere:
// it's the design artifact, not copy.
//
// NOTE: the Spanish and Hmong strings are first drafts written without a
// native-speaker review. Have a fluent reader check them before announcing
// the languages publicly — see README "Languages".

export const LANGS = [
  ['en', 'English'],
  ['es', 'Español'],
  ['hmn', 'Hmoob'],
];

// Browser date locales per board language. Hmong has no reliable ICU
// locale, so its dates render in the English pattern.
export const DATE_LOCALES = { en: 'en-US', es: 'es-US', hmn: 'en-US' };

export const STRINGS = {
  en: {
    tagline: 'Notes from your neighbors. Every one is read by an editor before it’s pinned.',
    cta: 'Post a note',
    thisWeek: 'This week:',
    newNotes: (n) => (n === 1 ? 'new note' : 'new notes'),
    fromWord: 'from',
    neighborsWord: (n) => (n === 1 ? 'neighbor' : 'neighbors'),
    boardOpen: 'The board is open.',
    allNotes: 'All notes',
    filterAria: 'Filter notes by category',
    loading: 'Pinning up the latest notes…',
    loadError: 'The board couldn’t load.',
    emptyUnder: (label) => `Nothing pinned under ${label} right now.`,
    beFirst: 'Be the first to post one',
    readWhole: 'Read the whole note',
    contact: 'Contact',
    share: 'Share',
    linkCopied: 'Link copied',
    editorsPick: 'Editor’s pick',
    stampTitle: 'Reviewed and approved by the editor',
    linkAria: 'Link to this note',
    houseRulesPre: 'House rules: be neighborly. No commercial ads, campaigning, or personal disputes — those belong in ',
    houseRulesLink: 'letters to the editor',
    houseRulesPost: '.',
    privacyLine: 'No cookies. No trackers. No third parties.',
    // Submit form
    newNote: 'New note',
    close: 'Close',
    formTitle: 'Post a note',
    formAria: 'Post a note to the Community Board',
    formRules: 'Be neighborly. No commercial ads, campaigning, or personal disputes. The editor reviews every note before it’s pinned.',
    category: 'Category',
    eventDate: 'Event date',
    title: 'Title',
    titlePlaceholder: 'Found: gray tabby near Franklin Elementary',
    yourNote: 'Your note',
    notePlaceholder: 'The details a neighbor would need…',
    charsLeft: (n) => `${n} characters left`,
    neighborhood: 'Neighborhood or area',
    optional: '(optional)',
    neighborhoodPlaceholder: 'Rib Mountain, East side, Kronenwetter…',
    yourName: 'Your name',
    nameNote: '(appears on the note)',
    email: 'Email',
    emailNote: '(never shown unless you say so)',
    contactOk: 'Let readers contact me at this email',
    send: 'Send to the editor',
    sending: 'Sending…',
    sentAria: 'Note received',
    sentTitle: 'Sent to the editor’s desk',
    sentBody: 'Your note is in the queue. The editor reads every submission before it’s pinned — most go up within a day. Thanks for posting, neighbor.',
    backToBoard: 'Back to the board',
    errRateLimit: 'You’ve reached the limit of 3 notes in 24 hours. Try again tomorrow.',
    errEventRange: 'Event dates need to fall within the coming year.',
    errTitle: 'Titles need to be between 5 and 80 characters.',
    errBody: 'Notes need to be between 20 and 600 characters.',
    errEventDate: 'Events need a date.',
  },

  es: {
    tagline: 'Notas de tus vecinos. Un editor lee cada una antes de publicarla.',
    cta: 'Publicar una nota',
    thisWeek: 'Esta semana:',
    newNotes: (n) => (n === 1 ? 'nota nueva' : 'notas nuevas'),
    fromWord: 'de',
    neighborsWord: (n) => (n === 1 ? 'vecino' : 'vecinos'),
    boardOpen: 'El tablón está abierto.',
    allNotes: 'Todas las notas',
    filterAria: 'Filtrar notas por categoría',
    loading: 'Colgando las últimas notas…',
    loadError: 'El tablón no pudo cargarse.',
    emptyUnder: (label) => `No hay nada publicado en ${label} por ahora.`,
    beFirst: 'Sé el primero en publicar una',
    readWhole: 'Leer la nota completa',
    contact: 'Contactar',
    share: 'Compartir',
    linkCopied: 'Enlace copiado',
    editorsPick: 'Selección del editor',
    stampTitle: 'Revisada y aprobada por el editor',
    linkAria: 'Enlace a esta nota',
    houseRulesPre: 'Reglas de la casa: sé buen vecino. Nada de anuncios comerciales, campañas ni disputas personales — eso va en ',
    houseRulesLink: 'cartas al editor',
    houseRulesPost: '.',
    privacyLine: 'Sin cookies. Sin rastreadores. Sin terceros.',
    newNote: 'Nota nueva',
    close: 'Cerrar',
    formTitle: 'Publicar una nota',
    formAria: 'Publicar una nota en el tablón comunitario',
    formRules: 'Sé buen vecino. Nada de anuncios comerciales, campañas ni disputas personales. El editor revisa cada nota antes de publicarla.',
    category: 'Categoría',
    eventDate: 'Fecha del evento',
    title: 'Título',
    titlePlaceholder: 'Encontrada: gata gris cerca de Franklin Elementary',
    yourNote: 'Tu nota',
    notePlaceholder: 'Los detalles que un vecino necesitaría…',
    charsLeft: (n) => `Quedan ${n} caracteres`,
    neighborhood: 'Vecindario o área',
    optional: '(opcional)',
    neighborhoodPlaceholder: 'Rib Mountain, East side, Kronenwetter…',
    yourName: 'Tu nombre',
    nameNote: '(aparece en la nota)',
    email: 'Correo electrónico',
    emailNote: '(nunca se muestra salvo que lo permitas)',
    contactOk: 'Permitir que los lectores me escriban a este correo',
    send: 'Enviar al editor',
    sending: 'Enviando…',
    sentAria: 'Nota recibida',
    sentTitle: 'Enviada al escritorio del editor',
    sentBody: 'Tu nota está en la cola. El editor lee cada envío antes de publicarlo — la mayoría aparece en un día. Gracias por participar, vecino.',
    backToBoard: 'Volver al tablón',
    errRateLimit: 'Alcanzaste el límite de 3 notas en 24 horas. Inténtalo mañana.',
    errEventRange: 'La fecha del evento debe estar dentro del próximo año.',
    errTitle: 'Los títulos deben tener entre 5 y 80 caracteres.',
    errBody: 'Las notas deben tener entre 20 y 600 caracteres.',
    errEventDate: 'Los eventos necesitan una fecha.',
  },

  hmn: {
    tagline: 'Cov ntawv los ntawm koj cov neeg zej zog. Ib tus editor nyeem txhua tsab ua ntej muab lo.',
    cta: 'Tso ib tsab ntawv',
    thisWeek: 'Lub lim tiam no:',
    newNotes: () => 'tsab ntawv tshiab',
    fromWord: 'los ntawm',
    neighborsWord: () => 'tus neeg zej zog',
    boardOpen: 'Lub rooj tshaj xo qhib lawm.',
    allNotes: 'Tag nrho cov ntawv',
    filterAria: 'Xaiv hom ntawv',
    loading: 'Tab tom muab cov ntawv tshiab lo…',
    loadError: 'Lub rooj tshaj xo qhib tsis tau.',
    emptyUnder: (label) => `Tsis muaj ntawv nyob rau ${label} tam sim no.`,
    beFirst: 'Ua thawj tus tso ib tsab',
    readWhole: 'Nyeem tag nrho tsab ntawv',
    contact: 'Tiv tauj',
    share: 'Qhia tawm',
    linkCopied: 'Luam tau lub link lawm',
    editorsPick: 'Editor xaiv',
    stampTitle: 'Tus editor twb nyeem thiab pom zoo lawm',
    linkAria: 'Lub link mus rau tsab ntawv no',
    houseRulesPre: 'Cov cai: ua ib tug neeg zej zog zoo. Tsis pub tso ntawv lag luam, ntawv xaiv tsa, lossis kev sib cav ntiag tug — cov ntawd xa mus rau ',
    houseRulesLink: 'tus editor',
    houseRulesPost: '.',
    privacyLine: 'Tsis muaj cookies. Tsis muaj kev taug qab. Tsis muaj neeg sab nraud.',
    newNote: 'Tsab ntawv tshiab',
    close: 'Kaw',
    formTitle: 'Tso ib tsab ntawv',
    formAria: 'Tso ib tsab ntawv rau lub rooj tshaj xo',
    formRules: 'Ua ib tug neeg zej zog zoo. Tsis pub tso ntawv lag luam, ntawv xaiv tsa, lossis kev sib cav ntiag tug. Tus editor nyeem txhua tsab ua ntej muab lo.',
    category: 'Hom ntawv',
    eventDate: 'Hnub ua koob tsheej',
    title: 'Lub npe',
    titlePlaceholder: 'Pom: miv txho ze Franklin Elementary',
    yourNote: 'Koj tsab ntawv',
    notePlaceholder: 'Cov ntsiab lus uas ib tug neeg zej zog xav paub…',
    charsLeft: (n) => `Tshuav ${n} tus ntawv`,
    neighborhood: 'Zej zog lossis cheeb tsam',
    optional: '(xaiv tau)',
    neighborhoodPlaceholder: 'Rib Mountain, East side, Kronenwetter…',
    yourName: 'Koj lub npe',
    nameNote: '(tshwm rau ntawm tsab ntawv)',
    email: 'Email',
    emailNote: '(tsis qhia tshwj tsis yog koj pom zoo)',
    contactOk: 'Cia cov neeg nyeem siv email no tiv tauj kuv',
    send: 'Xa mus rau tus editor',
    sending: 'Tab tom xa…',
    sentAria: 'Txais tau tsab ntawv lawm',
    sentTitle: 'Xa mus rau tus editor lub rooj lawm',
    sentBody: 'Koj tsab ntawv nyob hauv kab tos. Tus editor nyeem txhua tsab ua ntej muab lo — feem ntau tshwm hauv ib hnub. Ua tsaug uas koj tso, phooj ywg zej zog.',
    backToBoard: 'Rov qab mus rau lub rooj',
    errRateLimit: 'Koj tso txog 3 tsab hauv 24 teev lawm. Rov sim dua tag kis.',
    errEventRange: 'Hnub koob tsheej yuav tsum nyob hauv xyoo tom ntej.',
    errTitle: 'Lub npe yuav tsum muaj 5 txog 80 tus ntawv.',
    errBody: 'Tsab ntawv yuav tsum muaj 20 txog 600 tus ntawv.',
    errEventDate: 'Koob tsheej yuav tsum muaj hnub.',
  },
};

const I18nContext = createContext({ lang: 'en', t: STRINGS.en });

export const I18nProvider = I18nContext.Provider;

export function useI18n() {
  return useContext(I18nContext);
}

// localStorage can throw inside the embed (third-party storage blocked);
// the toggle still works for the visit, it just won't persist.
export function readLang() {
  try {
    const stored = localStorage.getItem('wpr_board_lang');
    return STRINGS[stored] ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function storeLang(lang) {
  try {
    localStorage.setItem('wpr_board_lang', lang);
  } catch {
    /* not persisted; fine */
  }
}
