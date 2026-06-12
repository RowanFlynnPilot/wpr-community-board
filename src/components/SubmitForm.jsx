import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { logEvent } from '../lib/analytics';
import { CATEGORIES, CATEGORY_KEYS } from '../lib/categories';
import Modal from './Modal';

const BODY_MAX = 600;

const EMPTY = {
  category: 'events',
  title: '',
  body: '',
  neighborhood: '',
  event_date: '',
  contact_name: '',
  contact_email: '',
  show_contact: false,
  website: '', // honeypot — humans never see this field
};

export default function SubmitForm({ onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const isEvent = form.category === 'events';

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Logged at the attempt, not on success — monthly_engagement counts
    // this as submissions_started, and the participation view counts what
    // actually arrived. The gap between them is the funnel.
    logEvent('submission', { category: form.category });

    const { error } = await supabase.rpc('submit_post', {
      p_category: form.category,
      p_title: form.title,
      p_body: form.body,
      p_neighborhood: form.neighborhood,
      p_event_date: isEvent ? form.event_date : null,
      p_contact_name: form.contact_name,
      p_contact_email: form.contact_email,
      p_show_contact: form.show_contact,
      p_website: form.website,
    });

    setSubmitting(false);

    if (error) {
      if (error.message.includes('RATE_LIMIT')) {
        setError('You’ve reached the limit of 3 notes in 24 hours. Try again tomorrow.');
      } else if (error.message.includes('EVENT_DATE_RANGE')) {
        setError('Event dates need to fall within the coming year.');
      } else if (error.message.includes('title')) {
        setError('Titles need to be between 5 and 80 characters.');
      } else if (error.message.includes('body')) {
        setError('Notes need to be between 20 and 600 characters.');
      } else if (error.message.includes('event_date')) {
        setError('Events need a date.');
      } else {
        setError(error.message);
      }
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Modal label="Note received" onClose={onClose}>
        <p className="card-stamp">RECEIVED</p>
        <h2 className="card-title">Sent to the editor&rsquo;s desk</h2>
        <p className="card-body">
          Your note is in the queue. The editor reads every submission before it&rsquo;s
          pinned — most go up within a day. Thanks for posting, neighbor.
        </p>
        <button className="board-cta" onClick={onClose}>
          Back to the board
        </button>
      </Modal>
    );
  }

  return (
    <Modal label="Post a note to the Community Board" onClose={onClose}>
      <div className="card-top">
        <span className="card-chip">New note</span>
        <button className="link-button" onClick={onClose}>
          Close
        </button>
      </div>

      <h2 className="card-title">Post a note</h2>
      <p className="form-rules">
        Be neighborly. No commercial ads, campaigning, or personal disputes. The editor
        reviews every note before it&rsquo;s pinned.
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
                {CATEGORIES[key].label}
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
            placeholder="Found: gray tabby near Franklin Elementary"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </label>

        <label className="form-label">
          Your note
          <textarea
            rows={5}
            required
            minLength={20}
            maxLength={BODY_MAX}
            placeholder="The details a neighbor would need&hellip;"
            value={form.body}
            onChange={(e) => update('body', e.target.value)}
          />
          <span className="form-count">{BODY_MAX - form.body.length} characters left</span>
        </label>

        <label className="form-label">
          Neighborhood or area <span className="form-optional">(optional)</span>
          <input
            type="text"
            maxLength={60}
            placeholder="Rib Mountain, East side, Kronenwetter&hellip;"
            value={form.neighborhood}
            onChange={(e) => update('neighborhood', e.target.value)}
          />
        </label>

        <div className="form-pair">
          <label className="form-label">
            Your name <span className="form-optional">(appears on the note)</span>
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
            Email <span className="form-optional">(never shown unless you say so)</span>
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
          Let readers contact me at this email
        </label>

        {/* Honeypot: hidden from people, irresistible to bots. */}
        <input
          type="text"
          name="website"
          className="hp-field"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.website}
          onChange={(e) => update('website', e.target.value)}
        />

        <button type="submit" className="board-cta" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send to the editor'}
        </button>
      </form>
    </Modal>
  );
}
