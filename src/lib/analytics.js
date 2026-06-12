import { supabase } from './supabase';

// A random first-party identifier. It never leaves this site, contains no
// personal information, and is cleared whenever the visitor clears site data.
// It exists so grant reports can count unique and returning visitors.
function visitorId() {
  let id = localStorage.getItem('wpr_board_id');
  if (!id) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('wpr_board_id', id);
  }
  return id;
}

// Fire-and-forget: analytics never block the interface. Failures are
// logged to the console so they're visible, not swallowed.
export function logEvent(eventType, { category = null, postId = null } = {}) {
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
}
