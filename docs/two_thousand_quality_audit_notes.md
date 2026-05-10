# 2,000-card quality audit notes

## Honest scope

The 2,000-card build has **not** been manually fact-checked problem by problem by domain experts. The correct label is still **source-backed draft**, not expert reviewed.

This pass added a stronger quality layer so that the site is safer and more transparent.

## Automated checks performed

- source ID integrity
- uncited partial-result cards
- uncited failure / obstruction cards
- duplicate problem IDs
- broken problem-relation targets
- broken graph edges
- citation-depth scoring
- review-priority assignment

## Results after this pass

- 2,000 problem cards
- 7,528 partial-result / proof-history cards
- 8,174 failure / obstruction cards
- 11,951 source records
- 32,516 first-class graph nodes
- 132,526 graph edges

## Citation uplift

The audit identified cards with thin source trails or source-discovery-heavy trails. It added independent citation-triangulation routes to 1,757 cards.

Added routes include:

- OpenAlex search
- arXiv search
- Semantic Scholar search
- Crossref metadata search
- MathOverflow search for math-facing cards

These are **triangulation routes**, not expert-verified citations. Domain editors should promote specific papers into primary citations after checking relevance.

## New per-card audit fields

Each problem now has a `qualityAudit` object containing:

- audit date
- structural citation audit status
- full manual fact-check status
- external expert review status
- citation tier
- review priority
- source count before the audit
- source count after the audit
- direct non-search source count
- added triangulation sources
- caveat

## Editorial rule

No card should be labeled expert reviewed unless a named domain expert or editor has reviewed it. Solved, disproved, and independence-status cards should receive high-priority human review.
