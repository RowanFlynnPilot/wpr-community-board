# Embedding the board in WordPress (Newspack)

Same approach as the gas tracker: an iframe pointing at the GitHub Pages
build, plus a tiny listener so the iframe is always exactly as tall as the
board (the app posts its height on every resize).

Create a full-width page in WordPress, add a **Custom HTML** block, and paste:

```html
<iframe
  id="wpr-community-board"
  src="https://rowanflynnpilot.github.io/wpr-community-board/"
  title="The Community Board — Wausau Pilot &amp; Review"
  style="width:100%;border:0;display:block;"
  height="900"
  loading="lazy"
></iframe>
<script>
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'wpr-board-height') {
      document.getElementById('wpr-community-board').height = event.data.height;
    }
  });
</script>
```

Notes:

- Use the page template without a sidebar so the three-column card grid gets
  full width.
- Deep links work: a shared note URL like `...#post-<id>` opens the board with
  that card in the page. Good for the newsletter.
- The `#/admin` desk is on the same deployment — never link it from the site;
  it's the editor's bookmark.
