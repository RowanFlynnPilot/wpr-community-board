import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CATEGORIES } from '../lib/categories';

export default function AdminPage() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return session ? <Desk /> : <SignIn />;
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function signIn() {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  return (
    <div className="board admin">
      <div className="card admin-signin">
        <p className="board-eyebrow">Wausau Pilot &amp; Review</p>
        <h1 className="card-title">The Editor&rsquo;s Desk</h1>
        {error && <p className="form-error" role="alert">{error}</p>}
        <label className="form-label">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="form-label">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && signIn()}
          />
        </label>
        <button className="board-cta" onClick={signIn}>
          Sign in
        </button>
      </div>
    </div>
  );
}

function Desk() {
  const [tab, setTab] = useState('pending');
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('status', ['pending', 'published'])
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setPosts(data);
  }

  useEffect(() => {
    load();
  }, []);

  const pending = posts?.filter((p) => p.status === 'pending') ?? [];
  const published = posts?.filter((p) => p.status === 'published') ?? [];
  const list = tab === 'pending' ? pending : published;

  async function approve(id) {
    const { error } = await supabase.rpc('publish_post', { p_id: id });
    if (error) setError(error.message);
    else load();
  }

  async function reject(id, reason) {
    const { error } = await supabase.rpc('reject_post', { p_id: id, p_reason: reason });
    if (error) setError(error.message);
    else load();
  }

  async function togglePin(post) {
    const { error } = await supabase
      .from('posts')
      .update({ is_pinned: !post.is_pinned })
      .eq('id', post.id);
    if (error) setError(error.message);
    else load();
  }

  async function takeDown(id) {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'expired' })
      .eq('id', id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div className="board admin">
      <header className="board-header">
        <img className="board-mark" src="./wpr-typewriter.png" alt="Wausau Pilot & Review" />
        <div className="board-titles">
          <p className="board-eyebrow">Wausau Pilot &amp; Review</p>
          <h1 className="board-title">The Editor&rsquo;s Desk</h1>
          <p className="board-tagline">Approve, reject, pin. Metrics live in Supabase &rarr; grant_report.</p>
        </div>
        <button className="link-button" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      {error && <p className="form-error" role="alert">{error}</p>}

      <nav className="filter-row" aria-label="Moderation queues">
        <button
          className={`filter-pill ${tab === 'pending' ? 'is-active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending <span className="pill-count">{pending.length}</span>
        </button>
        <button
          className={`filter-pill ${tab === 'published' ? 'is-active' : ''}`}
          onClick={() => setTab('published')}
        >
          Published <span className="pill-count">{published.length}</span>
        </button>
      </nav>

      {posts === null ? (
        <p className="board-loading">Loading the queue&hellip;</p>
      ) : list.length === 0 ? (
        <p className="board-empty">
          {tab === 'pending' ? 'The queue is clear. Nothing waiting.' : 'Nothing is currently published.'}
        </p>
      ) : (
        <div className="admin-list">
          {list.map((post) => (
            <AdminCard
              key={post.id}
              post={post}
              onApprove={approve}
              onReject={reject}
              onTogglePin={togglePin}
              onTakeDown={takeDown}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminCard({ post, onApprove, onReject, onTogglePin, onTakeDown }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const category = CATEGORIES[post.category];

  return (
    <article className="card admin-card">
      <div className="card-top">
        <span className="card-chip">
          <span className="pill-dot" style={{ background: category.dot }} aria-hidden="true" />
          {category.label}
        </span>
        <span className="card-stamp">
          {new Date(post.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      </div>

      <h2 className="card-title">{post.title}</h2>
      {post.event_date && <p className="card-event-date">Event: {post.event_date}</p>}
      <p className="card-body">{post.body}</p>
      <p className="card-byline">
        &mdash; {post.contact_name}
        {post.neighborhood ? `, ${post.neighborhood}` : ''} &middot; {post.contact_email}
        {post.show_contact ? ' (shown to readers)' : ' (kept private)'}
      </p>

      {post.status === 'pending' ? (
        rejecting ? (
          <div className="admin-actions">
            <input
              type="text"
              placeholder="Reason (kept on file, not sent)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button
              className="link-button danger"
              disabled={!reason.trim()}
              onClick={() => onReject(post.id, reason)}
            >
              Confirm reject
            </button>
            <button className="link-button" onClick={() => setRejecting(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="admin-actions">
            <button className="board-cta" onClick={() => onApprove(post.id)}>
              Approve &amp; pin to board
            </button>
            <button className="link-button danger" onClick={() => setRejecting(true)}>
              Reject
            </button>
          </div>
        )
      ) : (
        <div className="admin-actions">
          <button className="link-button" onClick={() => onTogglePin(post)}>
            {post.is_pinned ? 'Unpin from top' : 'Pin to top'}
          </button>
          <button className="link-button danger" onClick={() => onTakeDown(post.id)}>
            Take down
          </button>
        </div>
      )}
    </article>
  );
}
