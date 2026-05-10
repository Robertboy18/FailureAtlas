# Failure Atlas — 2,000+ problem-card build

This build reaches the requested 2,000-problem-card milestone.

- **2000 problem cards**
- **7528 partial-result / proof-history cards**
- **8174 failure / obstruction cards**
- **4219 source records**
- **24784 graph nodes**
- **124790 graph edges**

See `docs/two_thousand_problem_expansion_notes.md` for the expansion notes.

---

# Failure Atlas

This is a static research atlas of open problems, solved theorems, disproved conjectures, partial results, failed attempts, and cross-field method bridges.

## This build

This pass crosses the original scale target: the atlas now has **1,226 problem cards** across mathematics, computer science, and physics.

### Counts

- 1,226 problem cards
- 4,432 partial-result / proof-history cards
- 5,078 failure / obstruction cards
- 1,897 source records
- 15,003 first-class graph nodes
- 83,124 graph edges
- 17 cross-field bridge-family nodes

### What changed in the 1,000-card pass

- Added 220 new problem cards:
  - 73 Mathematics
  - 75 Computer Science
  - 72 Physics
- Each new card includes:
  - source-trail chips
  - partial-result/proof-history cards
  - failure/obstruction cards
  - bridge-family connections
  - graph nodes and graph edges
- The graph model now connects new problems to:
  - method nodes
  - bridge-family nodes
  - partial result nodes
  - failure nodes
  - source nodes
  - neighboring problem nodes when a natural anchor exists

## Files

- `index.html` — main static site
- `domain-math.html` — Mathematics landing page
- `domain-cs.html` — Computer Science landing page
- `domain-physics.html` — Physics landing page
- `assets/data-chunks/` and `assets/data-loader.js` — atlas data and graph model, split into GitHub-safe static chunks
- `assets/script.js` — main interactive site behavior
- `assets/domain.js` — domain landing page behavior
- `docs/one_thousand_problem_expansion_notes.md` — notes for this pass

## Review note

This atlas is **not** claiming external expert review. The new cards are marked as **source-backed** and should be treated as seed entries that need domain-editor cleanup, primary-paper replacement, statement verification, and expert review before becoming authoritative.

## Ulam / UnsolvedMath discovery seeds

The main atlas fetches the Hugging Face raw dataset files at runtime and merges Ulam/UnsolvedMath rows into the same Cards tab as discovery-seed entries:

- `problems.json`
- `categories.json`
- `sets.json`

Each imported row is converted into Failure Atlas-style seed objects:

- problem statement card
- proof-history/background card
- extracted partial-progress cards
- extracted failure/obstruction cards
- bridge-method tags
- source/provenance chips
- graph nodes for problem, category, set, difficulty, and method families

Ulam/UnsolvedMath is treated as provenance and discovery input, not as the final citation layer. Each imported card includes independent literature-search routes for OpenAlex, arXiv, Semantic Scholar, MathOverflow, zbMATH, and Crossref.

When opening the folder locally, serving it via a tiny local web server is recommended so the live fetch works consistently:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.


## Independent-source triangulation update

Imported Ulam-derived cards no longer treat Ulam as the only citation layer. Each imported problem now includes:

- Ulam / Hugging Face / UnsolvedMath provenance links
- independent search links for OpenAlex, arXiv, Semantic Scholar, MathOverflow, zbMATH, and Crossref
- extracted DOI, arXiv, URL, and LaTeX `\cite{...}` keys when found in the imported row
- a live **Run independent lookup** button that returns candidate scholarly works for the selected problem

See `docs/ulam_independent_source_triangulation_notes.md` for details.


## More problem cards pass

This latest pass adds **178 new problem cards** beyond the 1,000-card build. The additions span mathematics, computer science, and physics, and each added card includes:

- independent OpenAlex / arXiv / Semantic Scholar discovery links where applicable
- proof-history / partial-progress cards
- failure / obstruction cards
- method tags and bridge-family graph connections
- source-backed review labels

See `docs/more_problem_cards_v3_notes.md` for the validation summary.


## Clean-site more-cards expansion (2026-05-08)

This updated build adds **139** more source-backed draft problem cards across Mathematics, Computer Science, and Physics.

Current totals:

- **1365 problem cards**
- **4988 partial-result / proof-history cards**
- **5634 failure / obstruction cards**
- **2314 source records**
- **16800 graph nodes**
- **88816 graph edges**

See `docs/clean_more_cards_expansion_notes.md` for validation details.

## Additional clean expansion pass 2

This build now contains:

- **1535 problem cards**
- **5668 partial-result / proof-history cards**
- **6314 failure / obstruction cards**
- **2824 source records**
- **18993 first-class graph nodes**
- **104708 graph edges**

This pass added **170** more source-discovery draft cards across mathematics, computer science, and physics.

## Clean expansion pass 3

This build now includes:

- **1,754 problem cards**
- **6,544 partial-result / proof-history cards**
- **7,190 failure / obstruction cards**
- **3,481 source records**
- **21,803 first-class graph nodes**
- **119,446 graph edges**

Pass 3 added **219 new problem cards** across mathematics, computer science, and physics while preserving the cleaned website design. The added entries are source-backed drafts with external expert review pending.


## Quality-audit pass

This version includes a new quality-audit layer. The site now has 2,000 problem cards, 7,528 partial-result/proof-history cards, 8,174 failure/obstruction cards, and 11,951 source records.

Important: this does **not** mean every card has been manually expert verified. The audit checked structural source integrity and added citation-triangulation routes to cards with thin source trails. Each problem now carries a `qualityAudit` object with review priority, citation tier, and explicit caveats. The audit notes are in `docs/two_thousand_quality_audit_notes.md`.
