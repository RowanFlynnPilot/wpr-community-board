import { useState } from 'react';
import { logEvent } from '../lib/analytics';
import { CATEGORIES } from '../lib/categories';

const CLAMP_LENGTH = 180;

function formatStamp(iso) {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

function formatEventDate(dateStr) {
  // Parse as local date, not UTC midnight.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false);
  const [contactShown, setContactShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const category = CATEGORIES[post.category];
  const needsClamp = post.body.length > CLAMP_LENGTH;

  function expand() {
    if (expanded) return;
    setExpanded(true);
    logEvent('post_view', { category: post.category, postId: post.id });
  }

  function share() {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    logEvent('share_click', { category: post.category, postId: post.id });
  }

  function revealContact() {
    setContactShown(true);
    logEvent('contact_reveal', { category: post.category, postId: post.id });
  }

  return (
    <article className={`card ${post.is_pinned ? 'is-pinned' : ''}`} id={`post-${post.id}`}>
      <div className="card-top">
        <span className="card-chip">
          <span className="pill-dot" style={{ background: category.dot }} aria-hidden="true" />
          {category.label}
          {post.is_pinned && <span className="card-pick">&#9733; Editor&rsquo;s pick</span>}
        </span>
        <span className="card-stamp" title="Reviewed and approved by the editor">
          APPROVED &middot; {formatStamp(post.published_at)}
        </span>
      </div>

      <h2 className="card-title">{post.title}</h2>

      {post.event_date && (
        <p className="card-event-date">{formatEventDate(post.event_date)}</p>
      )}

      <p className="card-body">
        {expanded || !needsClamp ? post.body : `${post.body.slice(0, CLAMP_LENGTH).trimEnd()}\u2026`}
      </p>

      {needsClamp && !expanded && (
        <button className="link-button" onClick={expand}>
          Read the whole note
        </button>
      )}

      <div className="card-meta">
        <span className="card-byline">
          &mdash; {post.contact_name}
          {post.neighborhood ? `, ${post.neighborhood}` : ''}
        </span>
        <div className="card-actions">
          {post.contact_email && !contactShown && (
            <button className="link-button" onClick={revealContact}>
              Contact
            </button>
          )}
          {post.contact_email && contactShown && (
            <a className="card-email" href={`mailto:${post.contact_email}`}>
              {post.contact_email}
            </a>
          )}
          <button className="link-button" onClick={share}>
            {copied ? 'Link copied' : 'Share'}
          </button>
        </div>
      </div>
    </article>
  );
}
