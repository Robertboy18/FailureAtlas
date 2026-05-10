# Failure Atlas Code Map

This is a static site. Open `index.html` through a local server and the browser scripts render the atlas from the split data chunks in `assets/data-chunks/`.

## Main Files

- `index.html` defines the main tab panels, shared modal, and static page structure.
- `assets/styles.css` holds the full visual system: layout shells, cards, modal dossier, graphs, timeline, citations, suggestion mode, and responsive rules.
- `assets/script.js` is the main controller. It renders cards, detail modals, graph views, timeline, contribution previews, and optional runtime imported problem cards.
- `assets/domain-page.js` renders the dedicated Mathematics, Computer Science, and Physics pages.
- `assets/data-chunks/` is the generated atlas dataset split into GitHub-safe files. Treat it as data, not hand-authored UI logic.
- `assets/data-loader.js` joins those chunks and exposes `window.FAILURE_ATLAS_DATA`.

## Runtime Flow

1. The data chunk scripts load generated atlas text; `assets/data-loader.js` parses it into `window.FAILURE_ATLAS_DATA`.
2. `assets/script.js` builds lookup maps, cleans public text, infers missing domains, and renders the initial view.
3. Card clicks call `setActive`, which renders the dossier modal only when the user actually opens a card.
4. Math snippets are extracted from card fields and typeset with MathJax.
5. Optional imported open-problem rows are added after the static page loads; internal ids stay hidden from public hashes.

## Safe Edit Points

- To change visible copy, start in `index.html` and the render functions in `assets/script.js`.
- To change card/modal layout, edit the `Modal dossier`, `Problem dossier layout`, and `Card citations and suggestion mode` sections in `assets/styles.css`.
- To change graph behavior, edit the graph functions near the bottom of `assets/script.js`.
- To change dedicated domain pages, edit `domain-*.html` and `assets/domain-page.js`.

## Good Next Features

- A curated “guided path” through landmark problems.
- A review dashboard for cards missing primary citations or concrete failed attempts.
- A compare view for two cards, showing shared methods, barriers, sources, and neighbors.
- Persistent local suggestions for the `Suggest edit` tab using `localStorage`.
- A source-quality badge system: primary paper, survey, official problem page, dataset/list, discussion.
