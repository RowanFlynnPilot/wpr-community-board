import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logEvent } from '../lib/analytics';
import { categoryLabel } from '../lib/categories';
import { I18nProvider, LANGS, STRINGS, readLang, storeLang } from '../lib/i18n';
import CategoryFilter from './CategoryFilter';
import PostCard from './PostCard';
import SubmitForm from './SubmitForm';

// Captured once: "this week" is relative to when the reader arrived,
// which keeps render pure.
const PAGE_LOADED_AT = Date.now();

// The folio date follows the board language where the browser can.
const DATE_LOCALES = { en: 'en-US', es: 'es-US', hmn: 'en-US' };

export default function Board() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSubmit, setShowSubmit] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [lang, setLang] = useState(readLang);

  const t = STRINGS[lang];

  useEffect(() => {
    logEvent('board_view');
    // A shared deep link ('#post-<id>') names the card to open. Posts load
    // after first paint, so the browser's native anchor jump never fires —
    // the board handles it once the card exists.
    const match = window.location.hash.match(/^#post-([0-9a-f-]+)$/);
    supabase
      .from('board_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else {
          setPosts(data);
          if (match && data.some((p) => p.id === match[1])) setFocusId(match[1]);
        }
      });
  }, []);

  // Instant jump, like a native anchor: smooth scrolling stalls in
  // background tabs, and the focus ring already shows the reader where
  // to look.
  useEffect(() => {
    if (!focusId) return;
    document.getElementById(`post-${focusId}`)?.scrollIntoView({ block: 'center' });
  }, [focusId]);

  const visible = useMemo(() => {
    if (!posts) return [];
    if (activeCategory === 'all') return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  const pulse = useMemo(() => {
    if (!posts || posts.length === 0) return null;
    const weekAgo = PAGE_LOADED_AT - 7 * 24 * 60 * 60 * 1000;
    const recent = posts.filter((p) => new Date(p.published_at).getTime() > weekAgo);
    const neighbors = new Set(recent.map((p) => p.contact_name)).size;
    if (recent.length === 0) return null;
    return { notes: recent.length, neighbors };
  }, [posts]);

  function selectCategory(key) {
    setActiveCategory(key);
    if (key !== 'all') logEvent('filter_use', { category: key });
  }

  function openSubmit() {
    setShowSubmit(true);
    logEvent('submit_open');
  }

  function changeLang(next) {
    setLang(next);
    storeLang(next);
  }

  if (error) {
    return (
      <div className="board">
        <div className="board-error" role="alert">
          <strong>The board couldn&rsquo;t load.</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <I18nProvider value={{ lang, t }}>
      <div className="board" lang={lang}>
        <header className="board-header">
          <img className="board-mark" src="./wpr-typewriter.png" alt="Wausau Pilot & Review" />
          <div className="board-titles">
            <p className="board-eyebrow">Wausau Pilot &amp; Review</p>
            <h1 className="board-title">The Community Board</h1>
            <p className="board-tagline">{t.tagline}</p>
          </div>
          <button className="board-cta" onClick={openSubmit}>
            {t.cta}
          </button>
        </header>

        <p className="board-pulse">
          <span>
            {pulse ? (
              <>
                <span className="pulse-dot" aria-hidden="true" /> {t.thisWeek}{' '}
                <strong>{pulse.notes}</strong> {t.newNotes(pulse.notes)} {t.fromWord}{' '}
                <strong>{pulse.neighbors}</strong> {t.neighborsWord(pulse.neighbors)}
              </>
            ) : (
              t.boardOpen
            )}
          </span>
          <span className="pulse-date">
            {new Date()
              .toLocaleDateString(DATE_LOCALES[lang], {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
              .toUpperCase()}
          </span>
        </p>

        <CategoryFilter active={activeCategory} onSelect={selectCategory} posts={posts || []} />

        {posts === null ? (
          <p className="board-loading">{t.loading}</p>
        ) : visible.length === 0 ? (
          <div className="board-empty">
            <p>
              {t.emptyUnder(
                activeCategory === 'all' ? t.allNotes : categoryLabel(activeCategory, lang)
              )}
            </p>
            <button className="link-button" onClick={openSubmit}>
              {t.beFirst}
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {visible.map((post) => (
              <PostCard key={post.id} post={post} focused={post.id === focusId} />
            ))}
          </div>
        )}

        <footer className="board-footer">
          <p>
            {t.houseRulesPre}
            <a href="https://wausaupilotandreview.com/contact/">{t.houseRulesLink}</a>
            {t.houseRulesPost}
          </p>
          <p className="board-privacy">{t.privacyLine}</p>
          <p className="lang-row" aria-label="Language">
            {LANGS.map(([key, label]) => (
              <button
                key={key}
                className={`link-button ${lang === key ? 'is-current-lang' : ''}`}
                aria-pressed={lang === key}
                onClick={() => changeLang(key)}
              >
                {label}
              </button>
            ))}
          </p>
        </footer>

        {showSubmit && <SubmitForm onClose={() => setShowSubmit(false)} />}
      </div>
    </I18nProvider>
  );
}
