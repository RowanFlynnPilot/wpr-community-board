import { CATEGORIES, CATEGORY_KEYS } from '../lib/categories';

export default function CategoryFilter({ active, onSelect, posts }) {
  const counts = posts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <nav className="filter-row" aria-label="Filter notes by category">
      <button
        className={`filter-pill ${active === 'all' ? 'is-active' : ''}`}
        aria-pressed={active === 'all'}
        onClick={() => onSelect('all')}
      >
        All notes <span className="pill-count">{posts.length}</span>
      </button>
      {CATEGORY_KEYS.map((key) => (
        <button
          key={key}
          className={`filter-pill ${active === key ? 'is-active' : ''}`}
          aria-pressed={active === key}
          style={
            active === key
              ? { background: CATEGORIES[key].dot, borderColor: CATEGORIES[key].dot }
              : undefined
          }
          onClick={() => onSelect(key)}
        >
          <span
            className="pill-dot"
            style={{ background: active === key ? '#fff' : CATEGORIES[key].dot }}
            aria-hidden="true"
          />
          {CATEGORIES[key].label}
          {counts[key] ? <span className="pill-count">{counts[key]}</span> : null}
        </button>
      ))}
    </nav>
  );
}
