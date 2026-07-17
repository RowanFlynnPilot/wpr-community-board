import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CATEGORIES, CATEGORY_KEYS, categoryLabel } from '../lib/categories';
import { toCsv, downloadCsv } from '../lib/csv';
import { formatStamp } from '../lib/dates';
import { newsletterHtml } from '../lib/newsletter';
import { BOARD_URL, postUrl, useCopyLink } from '../lib/share';
import Modal from '../components/Modal';

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
      <main>
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
      </main>
    </div>
  );
}

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired' },
  { key: 'report', label: 'Report' },
];

const EMPTY_COPY = {
  pending: 'The queue is clear. Nothing waiting.',
  published: 'Nothing is currently published.',
  rejected: 'Nothing has been rejected.',
  expired: 'Nothing has expired yet.',
};

function Desk() {
  const [tab, setTab] = useState('pending');
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [composing, setComposing] = useState(false);

  function load() {
    supabase
      .from('posts')
      .select('*')
      .in('status', ['pending', 'published', 'rejected', 'expired'])
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPosts(data);
      });
  }

  useEffect(() => {
    load();
  }, []);

  // The bookmark tab shows the queue at a glance: "(3) The Editor's Desk".
  useEffect(() => {
    const pending = posts?.filter((p) => p.status === 'pending').length ?? 0;
    const base = 'The Editor’s Desk — Wausau Pilot & Review';
    document.title = pending > 0 ? `(${pending}) ${base}` : base;
    return () => {
      document.title = 'The Community Board — Wausau Pilot & Review';
    };
  }, [posts]);

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

  // Copy-editing before approval: title, body, and (for events) the event
  // date carry no derived state while pending — expiry isn't computed until
  // publish_post() runs, after any edit.
  async function saveEdit(post, draft) {
    const fields = { title: draft.title.trim(), body: draft.body.trim() };
    if (post.category === 'events') fields.event_date = draft.event_date;
    const { error } = await supabase
      .from('posts')
      .update(fields)
      .eq('id', post.id)
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
        <img
          className="board-mark"
          src="./wpr-typewriter.png"
          alt="Wausau Pilot & Review"
          width={76}
          height={76}
          decoding="async"
        />
        <div className="board-titles">
          <p className="board-eyebrow">Wausau Pilot &amp; Review</p>
          <h1 className="board-title">The Editor&rsquo;s Desk</h1>
          <p className="board-tagline">Approve, edit, reject, pin. The Report tab is the grant table.</p>
        </div>
        <button className="board-cta" onClick={() => setComposing(true)}>
          Write a note
        </button>
        <button className="link-button" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      <main>
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

      {tab === 'published' && byStatus('published').length > 0 && (
        <NewsletterSnippet posts={byStatus('published')} />
      )}

      {tab === 'report' ? (
        <ReportTab posts={posts} />
      ) : posts === null ? (
        <p className="board-loading">Loading the queue&hellip;</p>
      ) : list.length === 0 ? (
        <p className="board-empty">{EMPTY_COPY[tab]}</p>
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
      </main>

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onSubmitted={() => {
            setComposing(false);
            setTab('pending');
            load();
          }}
        />
      )}
    </div>
  );
}

// Dictation: notes that arrive by phone call or email get typed up here and
// enter through the same submit_post() path as everything else — under the
// neighbor's own name and email, landing in Pending for a normal approval.
// No analytics events fire: the funnel counts readers, not the desk.
const COMPOSE_EMPTY = {
  category: 'events',
  title: '',
  body: '',
  neighborhood: '',
  event_date: '',
  contact_name: '',
  contact_email: '',
  show_contact: false,
};

function ComposeModal({ onClose, onSubmitted }) {
  const [form, setForm] = useState(COMPOSE_EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEvent = form.category === 'events';

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await supabase.rpc('submit_post', {
      p_category: form.category,
      p_title: form.title,
      p_body: form.body,
      p_neighborhood: form.neighborhood,
      p_event_date: isEvent ? form.event_date : null,
      p_contact_name: form.contact_name,
      p_contact_email: form.contact_email,
      p_show_contact: form.show_contact,
      p_website: '',
    });

    setSubmitting(false);

    if (error) {
      if (error.message.includes('RATE_LIMIT') || error.message.includes('permission denied')) {
        setError(`${error.message} — has migration 004 been run? It lets the desk submit.`);
      } else if (error.message.includes('EVENT_DATE_RANGE')) {
        setError('Event dates need to fall within the coming year.');
      } else {
        setError(error.message);
      }
      return;
    }

    onSubmitted();
  }

  return (
    <Modal label="Write a note for a neighbor" onClose={onClose}>
      <div className="card-top">
        <span className="card-chip">Dictation</span>
        <button className="link-button" onClick={onClose}>
          Close
        </button>
      </div>

      <h2 className="card-title">Write a note</h2>
      <p className="form-rules">
        Taking a note over the phone or from an email? Type it up here. It lands in
        Pending under the neighbor&rsquo;s name — approve it like any other note.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        <label className="form-label">
          Category
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {categoryLabel(key)}
              </option>
            ))}
          </select>
        </label>

        {isEvent && (
          <label className="form-label">
            Event date
            <input
              type="date"
              required
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
            />
          </label>
        )}

        <label className="form-label">
          Title
          <input
            type="text"
            required
            minLength={5}
            maxLength={80}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </label>

        <label className="form-label">
          The note
          <textarea
            rows={5}
            required
            minLength={20}
            maxLength={600}
            value={form.body}
            onChange={(e) => update('body', e.target.value)}
          />
          <span className="form-count">{600 - form.body.length} characters left</span>
        </label>

        <label className="form-label">
          Neighborhood or area <span className="form-optional">(optional)</span>
          <input
            type="text"
            maxLength={60}
            placeholder="Rib Mountain, East side, Kronenwetter…"
            value={form.neighborhood}
            onChange={(e) => update('neighborhood', e.target.value)}
          />
        </label>

        <div className="form-pair">
          <label className="form-label">
            Neighbor&rsquo;s name <span className="form-optional">(appears on the note)</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={60}
              value={form.contact_name}
              onChange={(e) => update('contact_name', e.target.value)}
            />
          </label>
          <label className="form-label">
            Neighbor&rsquo;s email <span className="form-optional">(kept on file, not shown)</span>
            <input
              type="email"
              required
              value={form.contact_email}
              onChange={(e) => update('contact_email', e.target.value)}
            />
          </label>
        </div>

        <label className="form-check">
          <input
            type="checkbox"
            checked={form.show_contact}
            onChange={(e) => update('show_contact', e.target.checked)}
          />
          They said readers may contact them at this email
        </label>

        <button type="submit" className="board-cta" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add to Pending'}
        </button>
      </form>
    </Modal>
  );
}

function AdminCard({ post, onApprove, onReject, onSaveEdit, onTogglePin, onTakeDown }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [draft, setDraft] = useState({
    title: post.title,
    body: post.body,
    event_date: post.event_date ?? '',
  });
  const { copied, fallbackUrl, copy } = useCopyLink(postUrl(post.id));
  const category = CATEGORIES[post.category];
  const isEvent = post.category === 'events';

  return (
    <article className="card admin-card">
      <div className="card-top">
        <span className="card-chip">
          <span className="pill-dot" style={{ background: category.dot }} aria-hidden="true" />
          {categoryLabel(post.category)}
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
          {isEvent && (
            <label className="form-label">
              Event date
              <input
                type="date"
                value={draft.event_date}
                onChange={(e) => setDraft((d) => ({ ...d, event_date: e.target.value }))}
              />
            </label>
          )}
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

      {post.status === 'expired' && post.published_at && (
        <p className="admin-ran">Posted {formatStamp(post.published_at)}</p>
      )}

      {post.status === 'pending' &&
        (editing ? (
          <div className="admin-actions">
            <button
              className="board-cta"
              disabled={!draft.title.trim() || !draft.body.trim() || (isEvent && !draft.event_date)}
              onClick={() => {
                onSaveEdit(post, draft);
                setEditing(false);
              }}
            >
              Save edits
            </button>
            <button
              className="link-button"
              onClick={() => {
                setDraft({ title: post.title, body: post.body, event_date: post.event_date ?? '' });
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
            {removing ? (
              <>
                <button className="link-button danger" onClick={() => onTakeDown(post.id)}>
                  Confirm take-down
                </button>
                <button className="link-button" onClick={() => setRemoving(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="link-button" onClick={() => onTogglePin(post)}>
                  {post.is_pinned ? 'Unpin from top' : 'Pin to top'}
                </button>
                <button className="link-button" onClick={copy}>
                  {copied ? 'Link copied' : 'Copy link'}
                </button>
                <button className="link-button danger" onClick={() => setRemoving(true)}>
                  Take down
                </button>
              </>
            )}
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

// The newsletter loop, operationalized: one click copies a ready-to-paste
// HTML block — pinned picks first, then the newest — for the weekly
// newsletter's Custom HTML block. Deep links open the exact card.
function NewsletterSnippet({ posts }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(null);

  function copySnippet() {
    const html = newsletterHtml(posts, BOARD_URL);
    if (!navigator.clipboard) {
      setFallback(html);
      return;
    }
    navigator.clipboard
      .writeText(html)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setFallback(html));
  }

  return (
    <div className="newsletter-snippet">
      <button className="link-button" onClick={copySnippet}>
        {copied ? 'Snippet copied — paste into a Custom HTML block' : 'Copy newsletter snippet'}
      </button>
      {fallback && (
        <textarea
          className="newsletter-fallback"
          readOnly
          rows={8}
          value={fallback}
          onFocus={(e) => e.target.select()}
        />
      )}
    </div>
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
  ['spanish_sessions', 'Español sessions'],
  ['hmong_sessions', 'Hmoob sessions'],
];

function formatMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function ReportTab({ posts }) {
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

  return (
    <div className="report">
      {rows.length === 0 ? (
        <p className="board-empty">No activity recorded yet.</p>
      ) : (
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
      )}
      <div className="report-downloads">
        {rows.length > 0 && (
          <button
            className="link-button"
            onClick={() =>
              downloadCsv('grant_report.csv', toCsv(rows, REPORT_COLUMNS.map(([key]) => key)))
            }
          >
            Download CSV for the funder report
          </button>
        )}
        <button
          className="link-button"
          disabled={!posts?.length}
          onClick={() =>
            downloadCsv(
              `board-archive-${new Date().toISOString().slice(0, 10)}.csv`,
              toCsv(posts)
            )
          }
        >
          Download full archive (every note, for safekeeping)
        </button>
      </div>
      <p className="report-note">
        The archive is the whole posts table. Free-tier Supabase keeps no automated
        backups — download one after each busy month and keep it with the grant files.
      </p>
    </div>
  );
}
