import { lazy, Suspense, useEffect, useState } from 'react';
import Board from './components/Board';

// Code-split: readers never download the editor's desk.
const AdminPage = lazy(() => import('./admin/AdminPage'));

// Hash routing: '#/admin' is the editor's desk, everything else is the board.
// Hash routing because GitHub Pages serves a static file — there is no server
// to rewrite paths.
export default function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Report height to the parent page so the WordPress iframe fits exactly.
  useEffect(() => {
    const post = () =>
      window.parent.postMessage(
        { type: 'wpr-board-height', height: document.documentElement.scrollHeight },
        '*'
      );
    const observer = new ResizeObserver(post);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return hash.startsWith('#/admin') ? (
    <Suspense
      fallback={
        <div className="board">
          <p className="board-loading">Opening the desk&hellip;</p>
        </div>
      }
    >
      <AdminPage />
    </Suspense>
  ) : (
    <Board />
  );
}
