import { useEffect, useRef } from 'react';

// The accessible modal frame: focus moves into the dialog on open and back
// to the opener on close, Tab cycles inside, Escape closes, and the page
// behind stops scrolling. Inside the WordPress iframe the dialog is fixed to
// the top of a very tall frame, so it also scrolls itself into the reader's
// view on open.
export default function Modal({ label, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog.focus({ preventScroll: true });
    if (window.parent !== window) dialog.scrollIntoView({ block: 'start' });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, []);

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = dialogRef.current.querySelectorAll(
      'a[href], button:not(:disabled), input:not([tabindex="-1"]), select, textarea'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} onKeyDown={onKeyDown}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
