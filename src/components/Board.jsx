import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logEvent } from '../lib/analytics';
import { CATEGORIES } from '../lib/categories';
import CategoryFilter from './CategoryFilter';
import PostCard from './PostCard';
import SubmitForm from './SubmitForm';

export default function Board() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSubmit, setShowSubmit] = useState(false);
  const [focusId, setFocusId] = useState(null);

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
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
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
    <div className="board">
      <header className="board-header">
        <img className="board-mark" src="./wpr-typewriter.png" alt="Wausau Pilot & Review" />
        <div className="board-titles">
          <p className="board-eyebrow">Wausau Pilot &amp; Review</p>
          <h1 className="board-title">The Community Board</h1>
          <p className="board-tagline">
            Notes from your neighbors. Every one is read by an editor before it&rsquo;s pinned.
          </p>
        </div>
        <button className="board-cta" onClick={openSubmit}>
          Post a note
        </button>
      </header>

      <p className="board-pulse">
        <span>
          {pulse ? (
            <>
              <span className="pulse-dot" aria-hidden="true" /> This week:{' '}
              <strong>{pulse.notes}</strong> new {pulse.notes === 1 ? 'note' : 'notes'} from{' '}
              <strong>{pulse.neighbors}</strong> {pulse.neighbors === 1 ? 'neighbor' : 'neighbors'}
            </>
          ) : (
            'The board is open.'
          )}
        </span>
        <span className="pulse-date">
          {new Date()
            .toLocaleDateString('en-US', {
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
        <p className="board-loading">Pinning up the latest notes&hellip;</p>
      ) : visible.length === 0 ? (
        <div className="board-empty">
          <p>
            Nothing pinned under {CATEGORIES[activeCategory]?.label || 'this category'} right now.
          </p>
          <button className="link-button" onClick={openSubmit}>
            Be the first to post one
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
          House rules: be neighborly. No commercial ads, campaigning, or personal disputes —
          those belong in <a href="https://wausaupilotandreview.com/contact/">letters to the editor</a>.
        </p>
      </footer>

      {showSubmit && <SubmitForm onClose={() => setShowSubmit(false)} />}
    </div>
  );
}
