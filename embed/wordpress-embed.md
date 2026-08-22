# Embedding the board in WordPress (Newspack)

Same approach as the gas tracker: an iframe pointing at the GitHub Pages
build, plus a small script that (a) keeps the iframe exactly as tall as the
board and (b) forwards shared-note links into the iframe.

Create a full-width page in WordPress, add a **Custom HTML** block, and paste:

```html
<iframe
  id="wpr-community-board"
  src="https://rowanflynnpilot.github.io/wpr-community-board/"
  title="The Community Board — Wausau Pilot &amp; Review"
  style="width:100%;border:0;display:block;"
  height="900"
  allow="clipboard-write"
  loading="lazy"
></iframe>
<script>
  (function () {
    var frame = document.getElementById('wpr-community-board');

    // Deep links: a shared note URL is this page plus '#post-<id>'. The
    // fragment stays on the parent page, so pass it into the iframe — the
    // board scrolls to the card, opens it, and highlights it.
    if (location.hash.indexOf('#post-') === 0) {
      frame.src += location.hash;
    }

    // Auto-height: the app posts its height on every resize.
    window.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'wpr-board-height') {
        frame.height = event.data.height;
      }
    });
  })();
</script>
```

After the page exists, set the repo **Actions variable** `VITE_PUBLIC_URL`
(Settings → Secrets and variables → Actions → Variables) to the page's URL,
e.g. `https://wausaupilotandreview.com/community-board/`. From the next
deploy, every Share link points readers at the WordPress page instead of the
raw GitHub Pages URL.

Notes:

- `allow="clipboard-write"` is required for the Share button's one-click
  copy inside a cross-origin iframe. If a browser still refuses, the board
  falls back to showing the link in a selectable field.
- Use the page template without a sidebar so the three-column card grid gets
  full width.
- Deep links are newsletter-ready: link to
  `https://wausaupilotandreview.com/community-board/#post-<id>` and the board
  opens with that card scrolled into view and highlighted. The post id is in
  every Share link, or copy it from the editor's desk.
- Language editions: adding `?lang=es` or `?lang=hmn` to the iframe `src`
  presets the board's language — useful for a dedicated Spanish or Hmong
  page, or for links shared by partner organizations.
- The `#/admin` desk is on the same deployment — never link it from the site;
  it's the editor's bookmark.
