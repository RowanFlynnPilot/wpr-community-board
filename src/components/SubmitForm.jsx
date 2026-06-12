import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { logEvent } from '../lib/analytics';
import { CATEGORY_KEYS, categoryLabel } from '../lib/categories';
import { useI18n } from '../lib/i18n';
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
  const { lang, t } = useI18n();

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
        setError(t.errRateLimit);
      } else if (error.message.includes('EVENT_DATE_RANGE')) {
        setError(t.errEventRange);
      } else if (error.message.includes('title')) {
        setError(t.errTitle);
      } else if (error.message.includes('body')) {
        setError(t.errBody);
      } else if (error.message.includes('event_date')) {
        setError(t.errEventDate);
      } else {
        setError(error.message);
      }
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Modal label={t.sentAria} onClose={onClose}>
        <p className="card-stamp">RECEIVED</p>
        <h2 className="card-title">{t.sentTitle}</h2>
        <p className="card-body">{t.sentBody}</p>
        <button className="board-cta" onClick={onClose}>
          {t.backToBoard}
        </button>
      </Modal>
    );
  }

  return (
    <Modal label={t.formAria} onClose={onClose}>
      <div className="card-top">
        <span className="card-chip">{t.newNote}</span>
        <button className="link-button" onClick={onClose}>
          {t.close}
        </button>
      </div>

      <h2 className="card-title">{t.formTitle}</h2>
      <p className="form-rules">{t.formRules}</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        <label className="form-label">
          {t.category}
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {categoryLabel(key, lang)}
              </option>
            ))}
          </select>
        </label>

        {isEvent && (
          <label className="form-label">
            {t.eventDate}
            <input
              type="date"
              required
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
            />
          </label>
        )}

        <label className="form-label">
          {t.title}
          <input
            type="text"
            required
            minLength={5}
            maxLength={80}
            placeholder={t.titlePlaceholder}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </label>

        <label className="form-label">
          {t.yourNote}
          <textarea
            rows={5}
            required
            minLength={20}
            maxLength={BODY_MAX}
            placeholder={t.notePlaceholder}
            value={form.body}
            onChange={(e) => update('body', e.target.value)}
          />
          <span className="form-count">{t.charsLeft(BODY_MAX - form.body.length)}</span>
        </label>

        <label className="form-label">
          {t.neighborhood} <span className="form-optional">{t.optional}</span>
          <input
            type="text"
            maxLength={60}
            placeholder={t.neighborhoodPlaceholder}
            value={form.neighborhood}
            onChange={(e) => update('neighborhood', e.target.value)}
          />
        </label>

        <div className="form-pair">
          <label className="form-label">
            {t.yourName} <span className="form-optional">{t.nameNote}</span>
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
            {t.email} <span className="form-optional">{t.emailNote}</span>
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
          {t.contactOk}
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
          {submitting ? t.sending : t.send}
        </button>
      </form>
    </Modal>
  );
}
