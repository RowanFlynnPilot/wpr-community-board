import { useEffect, useState } from 'react';
import { logEvent } from '../lib/analytics';
import { categoryLabel, CATEGORIES } from '../lib/categories';
import { formatEventDate, formatStamp } from '../lib/dates';
import { useI18n } from '../lib/i18n';
import { postUrl, useCopyLink } from '../lib/share';

// Bodies longer than this get the CSS line clamp until the reader opens
// them. Clamping in CSS (not by slicing text) keeps the full note in the
// DOM, so the print stylesheet can show everything.
const CLAMP_LENGTH = 180;

export default function PostCard({ post, focused = false }) {
  const [expanded, setExpanded] = useState(false);
  const [contactShown, setContactShown] = useState(false);
  const { copied, fallbackUrl, copy } = useCopyLink(postUrl(post.id));
  const { lang, t } = useI18n();

  const category = CATEGORIES[post.category];
  const needsClamp = post.body.length > CLAMP_LENGTH;

  // A deep-linked card opens itself; that arrival is a post view.
  useEffect(() => {
    if (focused) expand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function expand() {
    if (expanded) return;
    setExpanded(true);
    logEvent('post_view', { category: post.category, postId: post.id });
  }

  function share() {
    logEvent('share_click', { category: post.category, postId: post.id });
    copy();
  }

  function revealContact() {
    setContactShown(true);
    logEvent('contact_reveal', { category: post.category, postId: post.id });
  }

  return (
    <article
      className={`card ${post.is_pinned ? 'is-pinned' : ''} ${focused ? 'is-focused' : ''}`}
      id={`post-${post.id}`}
    >
      <div className="card-top">
        <span className="card-chip">
          <span className="pill-dot" style={{ background: category.dot }} aria-hidden="true" />
          {categoryLabel(post.category, lang)}
          {post.is_pinned && <span className="card-pick">&#9733; {t.editorsPick}</span>}
        </span>
        <span className="card-stamp" title={t.stampTitle}>
          APPROVED &middot; {formatStamp(post.published_at)}
        </span>
      </div>

      <h2 className="card-title">{post.title}</h2>

      {post.event_date && (
        <p className="card-event-date">{formatEventDate(post.event_date)}</p>
      )}

      <p className={`card-body ${needsClamp && !expanded ? 'is-clamped' : ''}`}>{post.body}</p>

      {needsClamp && !expanded && (
        <button className="link-button" onClick={expand}>
          {t.readWhole}
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
              {t.contact}
            </button>
          )}
          {post.contact_email && contactShown && (
            <a className="card-email" href={`mailto:${post.contact_email}`}>
              {post.contact_email}
            </a>
          )}
          <button className="link-button" onClick={share}>
            {copied ? t.linkCopied : t.share}
          </button>
        </div>
      </div>

      {fallbackUrl && (
        <input
          className="card-share-url"
          readOnly
          value={fallbackUrl}
          aria-label={t.linkAria}
          autoFocus
          onFocus={(e) => e.target.select()}
        />
      )}
    </article>
  );
}
