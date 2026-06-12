import { useState } from 'react';

// Share links point at the page readers actually visit (the WordPress embed
// page) when VITE_PUBLIC_URL is set; otherwise wherever the app is served.
export const BOARD_URL =
  import.meta.env.VITE_PUBLIC_URL || `${window.location.origin}${window.location.pathname}`;

export function postUrl(id) {
  return `${BOARD_URL}#post-${id}`;
}

// One-click copy with the embed-safe fallback: when the clipboard is
// blocked, the link shows itself in a selectable field instead.
export function useCopyLink(url) {
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState(null);

  function copy() {
    if (!navigator.clipboard) {
      setFallbackUrl(url);
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setFallbackUrl(url));
  }

  return { copied, fallbackUrl, copy };
}
