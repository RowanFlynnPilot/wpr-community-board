import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CATEGORIES } from '../lib/categories';
import { postUrl, useCopyLink } from '../lib/share';

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

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'report', label: 'Report' },
];

function Desk() {
  const [tab, setTab] = useState('pending');
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    supabase
      .from('posts')
      .select('*')
      .in('status', ['pending', 'published', 'rejected'])
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPosts(data);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const byStatus = (status) => posts?.filter((p) => p.status === status) ?? [];
  const list = byStatus(tab);

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

  // Copy-editing before approval: title and body carry no derived state,
  // so this is a permitted direct update — and only while pending.
  async function saveEdit(id, draft) {
    const { error } = await supabase
      .from('posts')
      .update({ title: draft.title.trim(), body: draft.body.trim() })
      .eq('id', id)
      .eq('status', 'pending');
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
          <p className="board-tagline">Approve, edit, reject, pin. The Report tab is the grant table.</p>
        </div>
        <button className="link-button" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      {error && <p className="form-error" role="alert">{error}</p>}

      <nav className="filter-row" aria-label="Moderation queues">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-pill ${tab === key ? 'is-active' : ''}`}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
            {key !== 'report' && <span className="pill-count">{byStatus(key).length}</span>}
          </button>
        ))}
      </nav>

      {tab === 'report' ? (
        <ReportTab />
      ) : posts === null ? (
        <p className="board-loading">Loading the queue&hellip;</p>
      ) : list.length === 0 ? (
        <p className="board-empty">
          {tab === 'pending' && 'The queue is clear. Nothing waiting.'}
          {tab === 'published' && 'Nothing is currently published.'}
          {tab === 'rejected' && 'Nothing has been rejected.'}
        </p>
      ) : (
        <div className="admin-list">
          {list.map((post) => (
            <AdminCard
              key={post.id}
              post={post}
              onApprove={approve}
              onReject={reject}
              onSaveEdit={saveEdit}
              onTogglePin={togglePin}
              onTakeDown={takeDown}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminCard({ post, onApprove, onReject, onSaveEdit, onTogglePin, onTakeDown }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: post.title, body: post.body });
  const { copied, fallbackUrl, copy } = useCopyLink(postUrl(post.id));
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

      {editing ? (
        <div className="admin-edit">
          <label className="form-label">
            Title
            <input
              type="text"
              maxLength={80}
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </label>
          <label className="form-label">
            Note
            <textarea
              rows={5}
              maxLength={600}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
            />
          </label>
        </div>
      ) : (
        <>
          <h2 className="card-title">{post.title}</h2>
          {post.event_date && <p className="card-event-date">Event: {post.event_date}</p>}
          <p className="card-body">{post.body}</p>
        </>
      )}

      <p className="card-byline">
        &mdash; {post.contact_name}
        {post.neighborhood ? `, ${post.neighborhood}` : ''} &middot; {post.contact_email}
        {post.show_contact ? ' (shown to readers)' : ' (kept private)'}
      </p>

      {post.status === 'rejected' && (
        <p className="admin-reject-reason">Rejected: {post.reject_reason}</p>
      )}

      {post.status === 'pending' &&
        (editing ? (
          <div className="admin-actions">
            <button
              className="board-cta"
              disabled={!draft.title.trim() || !draft.body.trim()}
              onClick={() => {
                onSaveEdit(post.id, draft);
                setEditing(false);
              }}
            >
              Save edits
            </button>
            <button
              className="link-button"
              onClick={() => {
                setDraft({ title: post.title, body: post.body });
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : rejecting ? (
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
            <button className="link-button" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="link-button danger" onClick={() => setRejecting(true)}>
              Reject
            </button>
          </div>
        ))}

      {post.status === 'published' && (
        <>
          <div className="admin-actions">
            <button className="link-button" onClick={() => onTogglePin(post)}>
              {post.is_pinned ? 'Unpin from top' : 'Pin to top'}
            </button>
            <button className="link-button" onClick={copy}>
              {copied ? 'Link copied' : 'Copy link'}
            </button>
            <button className="link-button danger" onClick={() => onTakeDown(post.id)}>
              Take down
            </button>
          </div>
          {fallbackUrl && (
            <input
              className="card-share-url"
              readOnly
              value={fallbackUrl}
              aria-label="Link to this note"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          )}
        </>
      )}
    </article>
  );
}

// The grant table, on the desk: every metric in the proposal's Measurement
// & Evaluation section, one row per month, with a CSV download for funders.
const REPORT_COLUMNS = [
  ['month', 'Month'],
  ['unique_visitors', 'Unique visitors'],
  ['returning_visitors', 'Returning'],
  ['board_views', 'Board views'],
  ['post_views', 'Post reads'],
  ['shares', 'Shares'],
  ['connections', 'Connections'],
  ['submissions_received', 'Submissions'],
  ['posts_published', 'Published'],
  ['unique_contributors', 'Contributors'],
  ['first_time_contributors', 'First-time'],
  ['avg_hours_to_publish', 'Avg hrs to publish'],
];

function formatMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function downloadCsv(rows) {
  const keys = REPORT_COLUMNS.map(([key]) => key);
  const csv = [
    keys.join(','),
    ...rows.map((row) => keys.map((key) => row[key] ?? '').join(',')),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'grant_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function ReportTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from('grant_report')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(data);
      });
  }, []);

  if (error) {
    return <p className="form-error" role="alert">{error}</p>;
  }
  if (rows === null) {
    return <p className="board-loading">Adding up the month&hellip;</p>;
  }
  if (rows.length === 0) {
    return <p className="board-empty">No activity recorded yet.</p>;
  }

  return (
    <div className="report">
      <div className="report-scroll">
        <table className="report-table">
          <thead>
            <tr>
              {REPORT_COLUMNS.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                {REPORT_COLUMNS.map(([key]) => (
                  <td key={key}>{key === 'month' ? formatMonth(row.month) : row[key] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="link-button" onClick={() => downloadCsv(rows)}>
        Download CSV for the funder report
      </button>
    </div>
  );
}
