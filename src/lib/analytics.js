import { supabase } from './supabase';

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// A random first-party identifier. It never leaves this site, contains no
// personal information, and is cleared whenever the visitor clears site data.
// It exists so grant reports can count unique and returning visitors.
//
// Inside the WordPress iframe, browsers that block third-party storage throw
// on localStorage access. Analytics must never break the board, so those
// visits get a per-visit in-memory id instead.
let memoryId = null;

function visitorId() {
  try {
    let id = localStorage.getItem('wpr_board_id');
    if (!id) {
      id = randomId();
      localStorage.setItem('wpr_board_id', id);
    }
    return id;
  } catch {
    if (!memoryId) memoryId = randomId();
    return memoryId;
  }
}

// Fire-and-forget: analytics never block the interface. Failures are
// logged to the console so they're visible, not swallowed.
export function logEvent(eventType, { category = null, postId = null } = {}) {
  try {
    supabase
      .rpc('log_event', {
        p_event_type: eventType,
        p_session_id: visitorId(),
        p_category: category,
        p_post_id: postId,
      })
      .then(({ error }) => {
        if (error) console.error(`log_event(${eventType}) failed:`, error.message);
      });
  } catch (err) {
    console.error(`log_event(${eventType}) failed:`, err);
  }
}
