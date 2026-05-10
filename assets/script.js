(() => {
  // Main atlas controller: renders cards, modals, graphs, timeline, sources, and contribution tools.
  const data = window.FAILURE_ATLAS_DATA || { problems: [], sources: [], taxonomy: [] };
  const graphModel = data.graphModel || { nodes: [], edges: [] };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const els = {
    problemGrid: $('#problemGrid'),
    taxonomyGrid: $('#taxonomyGrid'),
    sourceList: $('#sourceList'),
    sourceSearch: $('#sourceSearch'),
    sourceTypeFilter: $('#sourceTypeFilter'),
    featuredGrid: $('#featuredGrid'),
    detailOverlay: $('#detailOverlay'),
    detailPanel: $('#detailPanel'),
    closeDetail: $('#closeDetail'),
    modalTitle: $('#modalTitle'),
    graphWrap: $('#graphWrap'),
    attemptGraphWrap: $('#attemptGraphWrap'),
    attemptInspector: $('#attemptInspector'),
    attemptGraphTitle: $('#attemptGraphTitle'),
    forceGraphWrap: $('#forceGraphWrap'),
    forceInspector: $('#forceInspector'),
    forceRestart: $('#forceRestart'),
    forceDepth: $('#forceDepth'),
    bridgeFamilyGrid: $('#bridgeFamilyGrid'),
    bridgeInspector: $('#bridgeInspector'),
    bridgeSelect: $('#bridgeSelect'),
    bridgeOnlyCrossDomain: $('#bridgeOnlyCrossDomain'),
    timelineGrid: $('#timelineGrid'),
    search: $('#problemSearch'),
    heroProblemCount: $('#heroProblemCount'),
    heroFailureCount: $('#heroFailureCount'),
    researchNote: $('#researchNote'),
    exploreButton: $('#exploreButton'),
    resultsMeta: $('#resultsMeta'),
    countMath: $('#countMath'),
    countCs: $('#countCs'),
    countPhysics: $('#countPhysics'),
    graphDomainSelect: $('#graphDomain'),
    graphEdgeModeSelect: $('#graphEdgeMode'),
    graphNeighborhoodCheckbox: $('#graphNeighborhood'),
    graphLabelsCheckbox: $('#graphLabels'),
    graphSearch: $('#graphSearch'),
    contributionForm: $('#contributionForm'),
    prepareCardButton: $('#prepareCardButton'),
    submissionPreview: $('#submissionPreview'),
  };

  // Lookup tables keep rendering functions fast and avoid repeated scans over the large dataset.
  const sourceById = new Map((data.sources || []).map((source) => [source.id, source]));
  const graphNodeById = new Map((graphModel.nodes || []).map((node) => [node.id, node]));
  const graphAdjacency = new Map();
  (graphModel.edges || []).forEach((edge) => {
    if (!graphAdjacency.has(edge.source)) graphAdjacency.set(edge.source, []);
    if (!graphAdjacency.has(edge.target)) graphAdjacency.set(edge.target, []);
    graphAdjacency.get(edge.source).push({ ...edge, other: edge.target, direction: 'out' });
    graphAdjacency.get(edge.target).push({ ...edge, other: edge.source, direction: 'in' });
  });

  const escape = (value) => String(value == null ? '' : value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  // Public copy is cleaned at runtime because the bundled data includes several generated drafts.
  function cleanPublicText(value) {
    let text = String(value == null ? '' : value).trim();
    if (!text) return '';
    text = text
      .replace(/\b1k expansion draft\b/gi, '')
      .replace(/\b(?:1,?000|one thousand|more(?: problem)? cards?|expansion)[-\s\w]*draft\b/gi, 'Sourced')
      .replace(/\bsource-backed\s+(?:import\s+)?drafts?\b/gi, 'Sourced')
      .replace(/\bimport\s+drafts?\b/gi, 'Sourced')
      .replace(/\bdraft evidence\b/gi, 'sourced evidence')
      .replace(/\bdrafts?\b/gi, 'entries')
      .replace(/\bA entries atlas card\b/gi, 'An atlas card')
      .replace(/\ba entries atlas card\b/gi, 'an atlas card')
      .replace(/\bprototype\b/gi, 'model case')
      .replace(/\bThis model case\b/g, 'This atlas build')
      .replace(/\bstatic model case\b/gi, 'static atlas build')
      .replace(/\badded in the more-problem-card pass\.?\s*/gi, '')
      .replace(/\bAn atlas card for an? ([^.]+?) frontier where ([^.]+?) shape the known routes and barriers\./gi, (_match, field, drivers) => `${field.charAt(0).toUpperCase()}${field.slice(1)} frontier: ${drivers} shape the known routes and barriers.`)
      .replace(/\s*;\s*source trails are independent literature-discovery routes/gi, '. Source trails provide literature search paths')
      .replace(/\bsource-backed\b/gi, 'sourced')
      .replace(/\bresearch-backed\b/gi, 'research based')
      .replace(/\bopen-problem\b/gi, 'open problem')
      .replace(/\bpartial-result\b/gi, 'partial result')
      .replace(/\bsolved-case\b/gi, 'solved case')
      .replace(/\bfailure-history\b/gi, 'failure history')
      .replace(/\bfailure-first\b/gi, 'failure focused')
      .replace(/\bcard-based\b/gi, 'card based')
      .replace(/\bgraph-native\b/gi, 'graph based')
      .replace(/\bsource-trail\b/gi, 'source trail')
      .replace(/\bproof-strategy\b/gi, 'proof strategy')
      .replace(/\bmethod-level\b/gi, 'method level')
      .replace(/\bliterature-discovery\b/gi, 'literature search')
      .replace(/\bcommunity-accepted\b/gi, 'accepted')
      .replace(/\bexpert-reviewed\b/gi, 'expert reviewed')
      .replace(/\bdomain-editor\b/gi, 'domain editor')
      .replace(/\bcross-field\b/gi, 'field bridge')
      .replace(/\bcross-domain\b/gi, 'across domains')
      .replace(/\blower-bound\b/gi, 'lower bound')
      .replace(/\bspecial-case\b/gi, 'special case')
      .replace(/\blow-dimensional\b/gi, 'low dimensional')
      .replace(/\bmodel-specific\b/gi, 'model specific')
      .replace(/\bconfiguration-level\b/gi, 'configuration level')
      .replace(/\blocal-solubility\b/gi, 'local solubility')
      .replace(/\bexplicit-estimate\b/gi, 'explicit estimate')
      .replace(/\bFourier-uniform\b/gi, 'Fourier uniform')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }
  const skipCleanKeys = new Set([
    'id', 'url', 'href', 'src', 'domain', 'target', 'problemId', 'sourceId',
    'sources', 'sourceIds', 'statementSources', 'problemIds', 'cardMath', 'math',
    'formula', 'image', 'type', 'kind',
  ]);
  function cleanAtlasTextFields(value, key = '') {
    if (typeof value === 'string') return skipCleanKeys.has(key) ? value : cleanPublicText(value);
    if (Array.isArray(value)) return skipCleanKeys.has(key) ? value : value.map((item) => cleanAtlasTextFields(item, key));
    if (value && typeof value === 'object') {
      Object.keys(value).forEach((itemKey) => {
        value[itemKey] = cleanAtlasTextFields(value[itemKey], itemKey);
      });
    }
    return value;
  }
  [data.problems, data.sources, data.taxonomy, data.timelineEvents, data.bridgeAtlas, graphModel.nodes, graphModel.edges]
    .filter(Boolean)
    .forEach((items) => cleanAtlasTextFields(items));
  const normalize = (value) => String(value || '').toLowerCase();
  const truncate = (value, length = 36) => {
    const text = String(value || '');
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  };
  function repairUnclosedMath(value) {
    let text = String(value || '');
    if ((text.match(/\$/g) || []).length % 2 === 1) {
      text = `${text.slice(0, text.lastIndexOf('$')).trimEnd()}…`;
    }
    if ((text.match(/\\\(/g) || []).length > (text.match(/\\\)/g) || []).length) {
      text = `${text.slice(0, text.lastIndexOf('\\(')).trimEnd()}…`;
    }
    if ((text.match(/\\\[/g) || []).length > (text.match(/\\\]/g) || []).length) {
      text = `${text.slice(0, text.lastIndexOf('\\[')).trimEnd()}…`;
    }
    return text.replace(/\s+…$/, '…');
  }
  function smartTruncate(value, length = 180) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= length) return repairUnclosedMath(text);
    const cut = text.slice(0, length - 1);
    const boundary = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf(','));
    return repairUnclosedMath(`${cut.slice(0, boundary > length * 0.6 ? boundary : cut.length).trimEnd()}…`);
  }
  const slug = (value) => normalize(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const typeset = (root = document.body) => {
    if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([root]).catch(() => {});
  };
  window.addEventListener('load', () => typeset(document.body));

  // Some imported rows omit a domain, so infer one from field, title, tags, and methods.
  function inferDomain(problem) {
    const hay = normalize([
      problem.field,
      problem.name,
      ...(problem.tags || []),
      ...(problem.buildingBlocks || []),
    ].join(' '));
    const physicsKeys = ['physics', 'cosmology', 'astronomy', 'astrophysics', 'particle', 'condensed matter', 'superconduct', 'dark matter', 'dark energy', 'qcd', 'quantum gravity', 'black hole', 'gravit', 'neutrino', 'plasma', 'climate'];
    const csKeys = ['computer science', 'complexity', 'algorithm', 'cryptography', 'logic', 'computation', 'quantum computing', 'machine learning', 'formal verification', 'proof complexity', 'circuit', 'approximation', 'parameterized', 'streaming', 'online matching'];
    if (physicsKeys.some((key) => hay.includes(key))) return 'physics';
    if (csKeys.some((key) => hay.includes(key))) return 'cs';
    return 'math';
  }

  const problemById = new Map();
  (data.problems || []).forEach((problem) => {
    const existingDomain = normalize(problem.domain);
    problem.domain = ['math', 'cs', 'physics'].includes(existingDomain) ? existingDomain : inferDomain(problem);
    const methodKeys = new Set([...(problem.buildingBlocks || []), ...(problem.tags || [])].map((x) => normalize(x)).filter(Boolean));
    problem._methodKeys = [...methodKeys];
    problemById.set(problem.id, problem);
  });

  const initialHash = (window.location.hash || '').replace('#', '');
  const validInitialViews = new Set(['overview', 'cards', 'failure', 'graph', 'timeline', 'contribution']);
  const initialProblemHash = Boolean(initialHash) && !validInitialViews.has(initialHash) && problemById.has(initialHash);
  const initialView = validInitialViews.has(initialHash) ? initialHash : (problemById.has(initialHash) ? 'cards' : null);
  let activeId = validInitialViews.has(initialHash) ? 'pnp' : (initialHash || 'pnp');
  if (!problemById.has(activeId)) activeId = (data.problems[0] || {}).id;
  let activeFilter = 'all';
  let activeDomain = 'all';
  let activeTimelineDomain = 'all';
  let activeSourceType = 'all';
  let sourceQuery = '';
  let graphQuery = '';
  let detailOpen = false;
  let graphState = { domain: 'all', edgeMode: 'both', neighborhoodOnly: false, showLabels: false };
  let forceState = { nodes: [], edges: [], selectedNodeId: null, dragging: null, svg: null };

  // Curated display formulas for landmark cards.
  const mathById = {
    bsd: '\\[\\operatorname{ord}_{s=1}L(E,s)=\\operatorname{rank}E(\\mathbb{Q})\\]',
    hodge: '\\[H^{p,p}(X)\\cap H^{2p}(X,\\mathbb Q)\\stackrel{?}{=}\\langle[Z]\\rangle_{\\mathbb Q}\\]',
    navier: '\\[\\partial_t u+(u\\cdot\\nabla)u=-\\nabla p+\\nu\\Delta u\\]',
    pnp: '\\[\\mathrm{P}\\stackrel{?}{=}\\mathrm{NP}\\]',
    poincare: '\\[\\pi_1(M)=0 \\Longrightarrow M \\cong S^3\\]',
    riemann: '\\[\\zeta(s)=0,\\ 0<\\Re(s)<1 \\Longrightarrow \\Re(s)=\\tfrac12\\]',
    yangmills: '\\[\\Delta = m_1-m_0 > 0\\]',
  };
  const ULAM_URLS = {
    problems: 'https://huggingface.co/datasets/ulamai/UnsolvedMath/raw/main/problems.json',
    categories: 'https://huggingface.co/datasets/ulamai/UnsolvedMath/raw/main/categories.json',
    sets: 'https://huggingface.co/datasets/ulamai/UnsolvedMath/raw/main/sets.json',
    source: 'https://huggingface.co/datasets/ulamai/UnsolvedMath',
  };
  const ULAM_SOURCE_ID = 'ulam-unsolvedmath-dataset';
  let ulamLoaded = false;

  // Label helpers normalize statuses and hide low-level import/review phrases from the UI.
  const domainLabel = (domain) => ({ math: 'Mathematics', cs: 'Computer Science', physics: 'Physics' }[domain] || 'Other');
  function cleanPublicLabel(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^(draft|source-backed draft|source-backed import draft|import draft)$/i.test(text)) return 'Sourced';
    if (/^(1k|one thousand|more cards?|more problem cards?|expansion)\b.*draft$/i.test(text)) return '';
    if (/expansion draft/i.test(text)) return '';
    if (/^(entries|new bridge card|new expansion card)$/i.test(text)) return '';
    if (/not a substitute for external expert review/i.test(text)) return '';
    if (/external expert review pending/i.test(text)) return '';
    return text;
  }
  function visibleSignal(problem) {
    return cleanPublicLabel(problem && problem.signal);
  }
  function normalizeFormula(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^\\\[/.test(text) || /^\\\(/.test(text) || /^\$/.test(text)) return text;
    return `\\[${text}\\]`;
  }

  // Formula extraction gives every card a compact math box when possible, even if the source text is plain prose.
  function extractDelimitedMath(text) {
    const value = String(text || '');
    const snippets = [];
    const patterns = [
      /\\\[([\s\S]*?)\\\]/g,
      /\\\(([\s\S]*?)\\\)/g,
      /\$([^$\n]{1,140})\$/g,
    ];
    patterns.forEach((pattern) => {
      let match = pattern.exec(value);
      while (match && snippets.length < 4) {
        const piece = String(match[1] || '').trim();
        if (piece && !snippets.includes(piece)) snippets.push(piece);
        match = pattern.exec(value);
      }
    });
    if (!snippets.length) return '';
    const joined = snippets.join(' \\quad ');
    return joined.length > 180 ? normalizeFormula(snippets[0]) : `\\[${joined}\\]`;
  }
  function extractSymbolFormula(text) {
    const value = String(text || '');
    const between = value.match(/\bprobability\s+between\s+([0-9]+\/[0-9]+)\s+and\s+([0-9]+\/[0-9]+)/i);
    if (between) return `<span class="formula-text">probability ∈ [${escape(between[1])}, ${escape(between[2])}]</span>`;
    const clauses = value
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+|;\s+|,\s+(?=(?:and|with|where|when)\b)/i)
      .map((item) => item.trim())
      .filter(Boolean);
    const symbolPattern = /(≥|≤|∈|∉|⊂|⊆|⊇|∞|→|↔|≠|≈|±|∑|∫|√|π|α|β|γ|δ|ε|λ|μ|ν|ζ|η|θ|κ|ρ|σ|τ|φ|χ|ψ|ω|[A-Za-z]\([^)]{1,50}\)|\b[a-zA-Z]\s*(?:=|<|>|≥|≤)\s*[-+]?[a-zA-Z0-9])/;
    const clause = clauses.find((item) => symbolPattern.test(item));
    if (!clause) return '';
    const normalized = clause.replace(/[?!.]\s*$/, '');
    const candidates = [
      normalized.match(/([A-Za-z]\([^)]{1,90}\)\s*(?:≥|≤|∈|∉|⊂|⊆|⊇|=|<|>|≠|≈)\s*[^.!?]{1,120})/u),
      normalized.match(/\bwhen\s+([^.!?]{0,130}(?:≥|≤|∈|∉|⊂|⊆|⊇|=|<|>|≠|≈)[^.!?]{0,130})/iu),
      normalized.match(/\bwhere\s+([^.!?]{0,130}(?:≥|≤|∈|∉|⊂|⊆|⊇|=|<|>|≠|≈)[^.!?]{0,130})/iu),
      normalized.match(/\bsuch that\s+([^.!?]{0,130}(?:≥|≤|∈|∉|⊂|⊆|⊇|=|<|>|≠|≈)[^.!?]{0,130})/iu),
      normalized.match(/(\b[a-zA-Z]\s*(?:=|<|>|≥|≤)\s*[^.!?]{1,120})/u),
    ];
    const compact = ((candidates.find(Boolean) || [null, normalized])[1] || normalized)
      .replace(/^(and|or|with|when|where)\s+/i, '')
      .slice(0, 170)
      .trim();
    return compact ? `<span class="formula-text">${escape(compact)}</span>` : '';
  }
  function derivedFormula(problem, includeLongFields = false) {
    if (!problem) return '';
    const direct = problem.math || problem.cardMath || mathById[problem.id];
    if (direct) return normalizeFormula(direct);
    const fields = [
      problem.oneLine,
      problem.plainStatement,
      problem.successCondition,
      includeLongFields ? problem.whyMatters : '',
      includeLongFields ? problem.currentStatus : '',
    ];
    for (const field of fields) {
      const math = extractDelimitedMath(field);
      if (math) return math;
    }
    for (const field of fields) {
      const math = extractSymbolFormula(field);
      if (math) return math;
    }
    return '';
  }
  function formulaHtml(problem, className = 'formula-line') {
    const value = derivedFormula(problem, className === 'detail-formula');
    if (!value || !String(value).trim()) return '';
    return `<div class="${className}">${value}</div>`;
  }
  function independentSearchQuery(problem) {
    return String([
      problem && problem.name,
      problem && problem.field,
      problem && problem.plainStatement,
    ].filter(Boolean).join(' '))
      .replace(/\\[a-zA-Z]+\{[^}]*\}/g, ' ')
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/[{}$^_\\]/g, ' ')
      .replace(/[^\p{L}\p{N}\s\-–—'’]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
  }

  // Runtime-imported cards get search links instead of pretending the discovery list is a final citation layer.
  function renderIndependentSearchPanel(problem) {
    if (!problem || !problem.ulamProvenance) return '';
    const query = independentSearchQuery(problem) || problem.name;
    const links = [
      ['OpenAlex', `https://openalex.org/works?search=${encodeURIComponent(query)}`],
      ['arXiv', `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all&source=header`],
      ['Semantic Scholar', `https://www.semanticscholar.org/search?q=${encodeURIComponent(query)}&sort=relevance`],
      ['MathOverflow', `https://mathoverflow.net/search?q=${encodeURIComponent(query)}`],
      ['zbMATH', `https://zbmath.org/?q=${encodeURIComponent(query)}`],
      ['Crossref', `https://search.crossref.org/?q=${encodeURIComponent(query)}`],
    ];
    return `<article class="detail-block full source-search-panel"><h4>Literature search</h4><p>Check the statement and failure history against primary literature.</p><p class="hint">Query: <code>${escape(query)}</code></p><div class="inline-sources"><span>Search</span>${links.map(([label, url]) => `<a class="source-link" href="${escape(url)}" target="_blank" rel="noopener">${escape(label)} ↗</a>`).join('')}</div></article>`;
  }
  function ensureUlamSource() {
    if (sourceById.has(ULAM_SOURCE_ID)) return;
    const source = {
      id: ULAM_SOURCE_ID,
      title: 'Discovery list for open problems',
      url: ULAM_URLS.source,
      note: 'Problem discovery list used to seed entries. Individual cards should be checked against primary literature.',
      sourceType: 'problem list',
      reviewCaveat: 'Discovery source.',
    };
    data.sources.push(source);
    sourceById.set(source.id, source);
  }

  // Optional live import: expands the local atlas with the public open-problem list at runtime.
  function ulamDomain(category, problem) {
    const hay = normalize(`${category} ${problem.title || ''} ${problem.statement || ''}`);
    if (hay.includes('computer') || hay.includes('algorithm') || hay.includes('complexity')) return 'cs';
    if (hay.includes('physics') || hay.includes('pde') || hay.includes('dynamical')) return 'physics';
    return 'math';
  }
  function ulamFamilies(problem, category, setName) {
    const hay = normalize(`${problem.title || ''} ${problem.statement || ''} ${problem.background || ''} ${category} ${setName}`);
    const families = [
      ['sieve / prime distribution', ['prime', 'goldbach', 'twin prime', 'mersenne', 'sieve']],
      ['Diophantine / height methods', ['diophantine', 'integer', 'rational', 'elliptic', 'height', 'mordell']],
      ['analytic number theory', ['zeta', 'riemann', 'l-function', 'modular', 'automorphic']],
      ['graph theory', ['graph', 'chromatic', 'color', 'ramsey', 'clique', 'edge']],
      ['extremal / probabilistic combinatorics', ['extremal', 'hypergraph', 'set', 'progression', 'density', 'ramsey']],
      ['topology', ['manifold', 'knot', 'sphere', 'topology', 'homotopy']],
      ['geometry', ['geometry', 'convex', 'packing', 'distance', 'polytope']],
      ['Fourier / harmonic analysis', ['fourier', 'operator', 'measure', 'dimension', 'analysis']],
      ['PDE / dynamics', ['pde', 'flow', 'dynamical', 'regularity', 'navier']],
      ['computational search', ['compute', 'verified', 'search', 'enumeration', 'finite', 'bound']],
      ['algorithms / complexity', ['algorithm', 'complexity', 'polynomial', 'np']],
    ].filter((item) => item[1].some((key) => hay.includes(key))).map((item) => item[0]);
    if (!families.length && category) families.push(category);
    return [...new Set(families)].slice(0, 6);
  }
  function sentenceFragments(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 28);
  }
  function extractUlamObstructionSentences(row) {
    const hay = `${row.background || ''} ${row.statement || ''}`;
    const terms = /\b(open|unknown|unresolved|unproved|conjectur|counterexample|obstruction|barrier|hard|difficult|not known|no known|cannot|fails?|exception|only known|partial|bound|verified|comput(?:ed|ational))\b/i;
    return sentenceFragments(hay)
      .filter((sentence) => terms.test(sentence))
      .slice(0, 3);
  }
  function familyAttemptTemplate(family, row, category) {
    const hay = normalize(`${row.title || ''} ${row.statement || ''} ${row.background || ''} ${category}`);
    const templates = [
      {
        match: /sieve|prime distribution|analytic number/,
        type: 'Failed route',
        title: 'Sieve and analytic estimates stop short',
        body: 'Classical sieve, density, or explicit estimate routes are the natural first attack, but they usually lose the correlations needed to force the exact prime or integer pattern in the full conjecture.',
      },
      {
        match: /diophantine|height/,
        type: 'Failed route',
        title: 'Height and descent reductions do not close the classification',
        body: 'Descent, height bounds, and local solubility checks reduce many special cases, but the remaining global finiteness or existence step is not forced by the statement.',
      },
      {
        match: /graph/,
        type: 'Failed route',
        title: 'Extremal and structural graph arguments leave resistant configurations',
        body: 'Degree, coloring, decomposition, and probabilistic constructions capture many boundary cases, but known structural reductions do not yet rule out all exceptional configurations.',
      },
      {
        match: /extremal|probabilistic|combinatorics/,
        type: 'Barrier',
        title: 'Random constructions and density increments miss the endpoint',
        body: 'Probabilistic examples, regularity decompositions, and density-increment methods explain partial thresholds, but the endpoint statement still needs sharper structure than these tools provide.',
      },
      {
        match: /fourier|harmonic|analysis/,
        type: 'Barrier',
        title: 'Fourier uniform control is too weak at the endpoint',
        body: 'Fourier or operator estimates control averaged structure, but the problem asks for a pointwise, extremal, or configuration level conclusion that survives known uniformity bounds.',
      },
      {
        match: /topology/,
        type: 'Failed route',
        title: 'Low dimensional or homotopy reductions do not decide the general case',
        body: 'Invariant and surgery-style reductions handle special families, but the full classification requires controlling exceptional embeddings, manifolds, or homotopy data not fixed by the basic invariants.',
      },
      {
        match: /geometry/,
        type: 'Barrier',
        title: 'Compactness and extremal examples do not identify the optimizer',
        body: 'Geometric compactness, perturbation, and extremal-configuration arguments produce candidates and bounds, but they do not isolate the exact global obstruction across all cases.',
      },
      {
        match: /pde|dynamics/,
        type: 'Barrier',
        title: 'A priori estimates fail to control the critical regime',
        body: 'Energy, compactness, or stability estimates handle regular regimes, but the open case sits at a scale or singular limit where the available bounds no longer close.',
      },
      {
        match: /computational/,
        type: 'Failed route',
        title: 'Finite computation has not become a proof of the infinite family',
        body: 'Search and verification can rule out many small cases or find patterns, but the imported problem still needs a certificate, invariant, or induction that scales beyond the checked range.',
      },
      {
        match: /algorithm|complexity/,
        type: 'Barrier',
        title: 'Model specific algorithms and lower bounds do not transfer',
        body: 'Algorithms or lower bounds in restricted models give evidence, but the unrestricted version needs a reduction or simulation argument that current techniques do not provide.',
      },
    ];
    const found = templates.find((item) => item.match.test(family) || item.match.test(hay));
    if (found) return found;
    return {
      type: 'Failed route',
      title: `${family} methods need a sharper obstruction`,
      body: `The imported problem points toward ${family}, but the atlas should track which standard reductions, examples, or invariants fail to settle the full statement.`,
    };
  }
  function obstructionTitle(sentence) {
    const text = normalize(sentence);
    if (text.includes('special case') || text.includes('special cases')) return 'Special-case proofs do not extend';
    if (text.includes('verified') || text.includes('computed') || text.includes('computational')) return 'Finite verification has not become a general proof';
    if (text.includes('bound') || text.includes('estimate')) return 'Known bounds miss the conjectural threshold';
    if (text.includes('counterexample')) return 'Counterexample search has not settled the statement';
    if (text.includes('partial')) return 'Partial progress leaves the main obstruction intact';
    if (text.includes('unknown') || text.includes('not known')) return 'Standard invariants do not decide the unknown case';
    return 'Known methods leave the main case open';
  }
  function ulamFailureCards(row, families, category) {
    const cards = [];
    extractUlamObstructionSentences(row).forEach((sentence, index) => {
      cards.push({
        type: index === 0 ? 'Failed route' : 'Known limitation',
        title: obstructionTitle(sentence),
        body: repairUnclosedMath(sentence),
        sources: [],
      });
    });
    families.slice(0, 4).forEach((family) => {
      const template = familyAttemptTemplate(family, row, category);
      if (cards.some((card) => card.title === template.title)) return;
      cards.push({ ...template, sources: [] });
    });
    return cards.slice(0, 5);
  }
  function toUlamProblem(row, catsById, setsById) {
    const category = (catsById.get(row.category_id) || {}).display_name || 'Open problems';
    const setName = (setsById.get(row.set_id) || {}).name || (setsById.get(row.set_id) || {}).display_name || 'Open problem collection';
    const families = ulamFamilies(row, category, setName);
    const statement = row.statement || row.title || 'Statement pending.';
    const background = row.background || 'Background and proof history still need an independent literature pass.';
    const id = `ulam_${row.id}`;
    return {
      id,
      name: row.title || `Open problem ${row.id}`,
      short: row.problem_number || `Problem ${row.id}`,
      field: category,
      signal: '',
      oneLine: smartTruncate(statement, 180),
      plainStatement: statement,
      whyMatters: truncate(background, 360),
      successCondition: 'An accepted proof, counterexample, or precise classification in the relevant literature.',
      currentStatus: `Current status: ${row.status || 'open'}. Verify before treating as authoritative.`,
      status: row.status || 'Open',
      tags: [...new Set([category, setName, ...families])].slice(0, 8),
      buildingBlocks: families,
      partialResults: [{ title: 'Background note', body: truncate(background, 420), sources: [ULAM_SOURCE_ID] }],
      failures: ulamFailureCards(row, families, category),
      relations: [],
      sources: [ULAM_SOURCE_ID],
      statementSources: [ULAM_SOURCE_ID],
      review: { stage: 'Sourced', externalExpertReview: 'Pending' },
      ulamProvenance: { id: row.id, problemNumber: row.problem_number, setName, category },
      domain: ulamDomain(category, row),
    };
  }
  function sanitizeLooseJson(text) {
    let output = '';
    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (escapeNext) {
        output += ch;
        escapeNext = false;
        continue;
      }
      if (ch === '\\') {
        output += ch;
        escapeNext = true;
        continue;
      }
      if (ch === '"') {
        output += ch;
        inString = !inString;
        continue;
      }
      if (inString && (ch === '\n' || ch === '\r')) {
        output += '\\n';
        continue;
      }
      output += ch;
    }
    return output;
  }

  // Some upstream JSON contains raw control characters inside strings; sanitize before parsing.
  async function fetchJsonLoose(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      return JSON.parse(sanitizeLooseJson(text));
    }
  }
  async function loadUlamIntoAtlas() {
    if (ulamLoaded || !window.fetch) return;
    ulamLoaded = true;
    ensureUlamSource();
    try {
      const [rows, categories, sets] = await Promise.all([
        fetchJsonLoose(ULAM_URLS.problems),
        fetchJsonLoose(ULAM_URLS.categories),
        fetchJsonLoose(ULAM_URLS.sets),
      ]);
      const catsById = new Map((categories || []).map((item) => [item.id, item]));
      const setsById = new Map((sets || []).map((item) => [item.id, item]));
      (rows || []).filter((row) => row && row.published !== false).forEach((row) => {
        const problem = toUlamProblem(row, catsById, setsById);
        if (problemById.has(problem.id)) return;
        problem._methodKeys = [...new Set([...(problem.buildingBlocks || []), ...(problem.tags || [])].map((x) => normalize(x)).filter(Boolean))];
        data.problems.push(problem);
        problemById.set(problem.id, problem);
      });
      renderStats();
      renderFeaturedProblems();
      renderProblemCards();
      renderSourceFilters();
      renderSources();
      renderTimeline();
    } catch (error) {
      if (els.resultsMeta) els.resultsMeta.textContent = `${currentProblems().length} cards shown`;
    }
  }
  function statusClass(status) {
    const value = normalize(status);
    if (value.includes('disproved') || value.includes('false')) return 'disproved';
    if (value.includes('solved') && !value.includes('unsolved') && !value.includes('open')) return 'solved';
    return 'unsolved';
  }
  function displayStatus(status) {
    const value = normalize(status);
    if (value.includes('disputed') || value.includes('claim')) return 'Disputed';
    if (value.includes('disproved') || value.includes('false')) return 'Disproved';
    if (value.includes('solved') && !value.includes('unsolved') && !value.includes('open')) return 'Solved';
    if (value.includes('open') || value.includes('unsolved') || value.includes('active')) return 'Open';
    if (value.includes('independent')) return 'Independent';
    if (value.includes('foundational')) return 'Assumption';
    if (value.includes('program')) return 'Program';
    if (value.includes('partial')) return 'Partial';
    return truncate(cleanPublicText(status || 'Open'), 28);
  }
  // Source renderers are shared by cards, timeline entries, graph inspectors, and exports.
  function sourceLink(id) {
    const source = sourceById.get(id);
    if (!source) return '';
    return `<a class="source-link" href="${escape(source.url)}" target="_blank" rel="noopener">${escape(source.title)} ↗</a>`;
  }
  function sourceHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (_error) {
      return '';
    }
  }
  function sourceCard(id) {
    const source = sourceById.get(id);
    if (!source) return '';
    const type = cleanPublicLabel(source.sourceType || 'source') || 'source';
    const host = sourceHost(source.url);
    return `<article class="source-mini-card citation-card"><div class="citation-topline"><span class="mini-label">${escape(type)}</span>${host ? `<span class="citation-host">${escape(host)}</span>` : ''}</div><h4>${escape(source.title)}</h4><p>${escape(source.note || 'Source attached to this card.')}</p><a class="source-link" href="${escape(source.url)}" target="_blank" rel="noopener">Open source ↗</a></article>`;
  }
  function renderCitationBlocks(ids = [], empty = 'No citations yet.') {
    const unique = [...new Set(ids || [])].map((id) => sourceById.get(id)).filter(Boolean);
    if (!unique.length) return `<span class="hint">${escape(empty)}</span>`;
    return `<div class="citation-list">${unique.map((source, index) => {
      const type = cleanPublicLabel(source.sourceType || 'source') || 'source';
      const host = sourceHost(source.url);
      return `<article class="citation-card">
        <div class="citation-topline"><span class="citation-index">${index + 1}</span><span>${escape(type)}</span>${host ? `<span>${escape(host)}</span>` : ''}</div>
        <h4>${escape(source.title)}</h4>
        <p>${escape(source.note || 'Source attached to this card.')}</p>
        <a class="source-link" href="${escape(source.url)}" target="_blank" rel="noopener">Open source ↗</a>
      </article>`;
    }).join('')}</div>`;
  }
  function renderInlineSources(ids = []) {
    const links = [...new Set(ids || [])].map((id) => sourceLink(id)).filter(Boolean);
    if (!links.length) return '';
    return `<div class="inline-sources"><span>Cites</span>${links.join('')}</div>`;
  }

  function renderQualityAudit(problem) {
    const audit = problem.qualityAudit;
    if (!audit) return '';
    const added = audit.addedTriangulationSources || [];
    const addedPreview = added.slice(0, 8).map((id) => sourceLink(id)).filter(Boolean).join('');
    return `<article class="detail-block full quality-audit-card">
      <h4>Quality / citation audit</h4>
      <div class="coverage-strip compact">
        <span><strong>${escape(audit.citationTier || 'Unscored')}</strong></span>
        <span><strong>${escape(audit.reviewPriority || 'standard')}</strong> review priority</span>
        <span><strong>${escape(audit.sourceCountAfterAudit || 0)}</strong> total source links</span>
        <span><strong>${escape(audit.directNonSearchSourceCount || 0)}</strong> non-search sources</span>
      </div>
      <p>${escape(audit.structuralCitationAudit || '')}</p>
      <p><strong>Manual correctness check:</strong> ${escape(audit.fullManualFactCheck || 'not completed for every card')}</p>
      <p>${escape(audit.caveat || '')}</p>
      ${added.length ? `<div class="inline-sources"><span>Added triangulation trails</span>${addedPreview}${added.length > 8 ? `<span class="source-link">+${added.length - 8} more</span>` : ''}</div>` : ''}
    </article>`;
  }

  // Export helpers let a card leave the UI as Markdown, JSON, or a compact source bundle.
  function exportMarkdown(problem) {
    const sourceLines = (problem.sources || []).map((id) => {
      const source = sourceById.get(id);
      return source ? `- ${source.title}: ${source.url}` : '';
    }).filter(Boolean).join('\n');
    const failureLines = (problem.failures || []).map((failure) => `- **${failure.title}** (${failure.type || 'Failure'}): ${failure.body}`).join('\n');
    const resultLines = (problem.partialResults || []).map((result) => `- **${result.title}**: ${result.body}`).join('\n');
    return `# ${problem.name}\n\n**Status:** ${displayStatus(problem.status)}\n**Domain:** ${domainLabel(problem.domain)}\n\n${problem.oneLine || ''}\n\n## Statement\n${problem.plainStatement || ''}\n\n## Why It Matters\n${problem.whyMatters || ''}\n\n## Partial Results\n${resultLines || '- Not yet mapped.'}\n\n## Failed / Stalled Routes\n${failureLines || '- Not yet mapped.'}\n\n## Sources\n${sourceLines || '- No source trail yet.'}\n`;
  }

  function exportJson(problem) {
    return JSON.stringify(problem, null, 2);
  }

  function exportSources(problem) {
    return (problem.sources || []).map((id) => {
      const source = sourceById.get(id);
      if (!source) return '';
      return `${source.title}\n${source.url}\n${source.note || ''}`;
    }).filter(Boolean).join('\n\n---\n\n') || 'No source trail yet.';
  }

  function downloadText(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function slugify(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'failure-atlas-card';
  }

  function sharedScore(a, b) {
    if (!a || !b || a.id === b.id) return 0;
    const setA = new Set(a._methodKeys || []);
    let score = 0;
    for (const key of b._methodKeys || []) if (setA.has(key)) score += 1;
    if (normalize(a.field) === normalize(b.field)) score += 0.5;
    return score;
  }
  // Shared-method neighbors are computed client-side from tags and building blocks.
  function getSharedNeighbors(problem, limit = 8) {
    return (data.problems || [])
      .map((candidate) => ({ candidate, score: sharedScore(problem, candidate) }))
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
      .slice(0, limit)
      .map((item) => ({ target: item.candidate.id, kind: 'shared-method', label: `shared methods (${item.score})`, score: item.score }));
  }

  function currentProblems() {
    const query = normalize(els.search && els.search.value);
    return (data.problems || []).filter((problem) => {
      const matchesFilter = activeFilter === 'all' || statusClass(problem.status) === activeFilter;
      const matchesDomain = activeDomain === 'all' || problem.domain === activeDomain;
      const haystack = normalize([
        problem.name,
        problem.short,
        problem.field,
        problem.signal,
        problem.oneLine,
        problem.plainStatement,
        ...(problem.tags || []),
        ...(problem.buildingBlocks || []),
      ].join(' '));
      return matchesFilter && matchesDomain && (!query || haystack.includes(query));
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Overview counters and domain cards are derived from the current in-memory atlas.
  function renderStats() {
    const counts = { math: 0, cs: 0, physics: 0 };
    (data.problems || []).forEach((problem) => { counts[problem.domain] += 1; });
    const failureCount = (data.problems || []).reduce((sum, problem) => sum + (problem.failures || []).length, 0);
    if (els.heroProblemCount) els.heroProblemCount.textContent = data.problems.length;
    if (els.heroFailureCount) els.heroFailureCount.textContent = failureCount;
    if (els.researchNote) {
      els.researchNote.textContent = 'Problem cards, failed routes, partial results, and source trails in one searchable atlas.';
    }
    if (els.exploreButton) els.exploreButton.textContent = `Explore ${data.problems.length} cards`;
    if (els.countMath) els.countMath.textContent = `${counts.math} cards`;
    if (els.countCs) els.countCs.textContent = `${counts.cs} cards`;
    if (els.countPhysics) els.countPhysics.textContent = `${counts.physics} cards`;
  }

  function featuredProblems() {
    const preferred = ['pnp', 'riemann', 'navier', 'yangmills', 'bsd', 'dark-matter-nature'];
    const picked = [];
    preferred.forEach((id) => {
      const problem = problemById.get(id);
      if (problem && !picked.includes(problem)) picked.push(problem);
    });
    if (picked.length < 6) {
      (data.problems || [])
        .filter((problem) => ['math', 'cs', 'physics'].includes(problem.domain))
        .sort((a, b) => ((b.failures || []).length + (b.partialResults || []).length) - ((a.failures || []).length + (a.partialResults || []).length))
        .forEach((problem) => {
          if (picked.length < 6 && !picked.some((item) => item.id === problem.id)) picked.push(problem);
        });
    }
    return picked.slice(0, 6);
  }

  const featuredImageById = {
    pnp: 'assets/landmark-p-vs-np.png',
    riemann: 'assets/landmark-riemann.png',
    navier: 'assets/landmark-navier-stokes.png',
    yangmills: 'assets/landmark-yang-mills.png',
    bsd: 'assets/landmark-bsd.png',
    'dark-matter-nature': 'assets/landmark-dark-matter.png',
  };

  function renderFeaturedProblems() {
    if (!els.featuredGrid) return;
    els.featuredGrid.innerHTML = featuredProblems().map((problem) => {
      const image = featuredImageById[problem.id];
      return `
      <article class="featured-card ${problem.domain}" data-featured-id="${escape(problem.id)}" tabindex="0" role="button" aria-label="Open ${escape(problem.name)}">
        ${image ? `<img class="featured-card-image" src="${escape(image)}" alt="${escape(problem.name)} visual diagram" />` : ''}
        <div class="status-row"><span class="status-pill ${statusClass(problem.status)}">${escape(displayStatus(problem.status))}</span><span class="domain-pill ${problem.domain}">${escape(domainLabel(problem.domain))}</span></div>
        <h3>${escape(problem.name)}</h3>
        <p>${escape(repairUnclosedMath(problem.oneLine))}</p>
        <div class="coverage-strip compact"><span><strong>${(problem.buildingBlocks || []).length}</strong> methods</span><span><strong>${(problem.failures || []).length}</strong> failures</span></div>
      </article>`;
    }).join('');
    els.featuredGrid.querySelectorAll('[data-featured-id]').forEach((card) => {
      const handler = () => setActive(card.dataset.featuredId, true);
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
    });
  }

  function renderProblemCards() {
    if (!els.problemGrid) return;
    const problems = currentProblems();
    if (els.resultsMeta) {
      const domainText = activeDomain === 'all' ? 'all domains' : domainLabel(activeDomain);
      const statusText = activeFilter === 'all' ? 'all statuses' : activeFilter;
      els.resultsMeta.textContent = `${problems.length} cards shown · ${domainText} · ${statusText}`;
    }
    if (!problems.length) {
      els.problemGrid.innerHTML = `<article class="problem-card"><h3>No cards found</h3><p>Try a different query or filter.</p></article>`;
      return;
    }
    els.problemGrid.innerHTML = problems.map((problem) => {
      const signal = visibleSignal(problem);
      const formula = formulaHtml(problem);
      return `
      <article class="problem-card ${problem.id === activeId ? 'active' : ''} ${formula ? '' : 'no-formula'}" data-id="${escape(problem.id)}" tabindex="0" role="button" aria-label="Open ${escape(problem.name)}">
        <div>
          <div class="status-row">
            <span class="status-pill ${statusClass(problem.status)}">${escape(displayStatus(problem.status))}</span>
            <span class="domain-pill ${problem.domain}">${escape(domainLabel(problem.domain))}</span>
          </div>
          <h3>${escape(problem.name)}</h3>
          ${formula}
          <p>${escape(repairUnclosedMath(problem.oneLine))}</p>
        </div>
        <div class="card-footer"><span>${escape(problem.field)}</span>${signal ? `<span>${escape(signal)}</span>` : ''}</div>
      </article>`;
    }).join('');
    $$('.problem-card[data-id]').forEach((card) => {
      card.addEventListener('click', () => setActive(card.dataset.id, true));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive(card.dataset.id, true); }
      });
    });
    typeset(els.problemGrid);
  }

  // Main modal renderer. Tabs keep the card readable without forcing a long scroll.
  function renderDetail(problem) {
    if (!els.detailPanel || !problem) return;
    const sharedNeighbors = getSharedNeighbors(problem, 6);
    const primarySourceIds = [...new Set([...(problem.statementSources || []), ...(problem.sources || [])])];
    const methodText = (problem.buildingBlocks || []).join(', ');
    const firstResult = (problem.partialResults || [])[0] || {};
    const firstFailure = (problem.failures || [])[0] || {};
    els.detailPanel.innerHTML = `
      <div class="detail-dossier">
        <aside class="detail-dossier-sidebar">
          <div class="status-row"><span class="status-pill ${statusClass(problem.status)}">${escape(displayStatus(problem.status))}</span><span class="domain-pill ${problem.domain}">${escape(domainLabel(problem.domain))}</span></div>
          <h3>${escape(problem.name)}</h3>
          ${formulaHtml(problem, 'detail-formula')}
          <p>${escape(repairUnclosedMath(problem.oneLine))}</p>
          <div class="coverage-strip compact"><span><strong>${(problem.buildingBlocks || []).length}</strong> methods</span><span><strong>${(problem.partialResults || []).length}</strong> partial</span><span><strong>${(problem.failures || []).length}</strong> failures</span><span><strong>${sharedNeighbors.length}</strong> neighbors</span></div>
          <div class="chip-list">${(problem.tags || []).slice(0, 10).map((tag) => `<span class="chip">${escape(tag)}</span>`).join('')}</div>
          <div class="export-actions" aria-label="Export card">
            <button type="button" class="button small secondary" data-export="markdown">Markdown</button>
            <button type="button" class="button small secondary" data-export="json">JSON</button>
            <button type="button" class="button small secondary" data-export="sources">Sources</button>
          </div>
        </aside>
        <section class="detail-dossier-main">
          <div class="detail-tabs" role="tablist" aria-label="Problem detail sections">
            <button type="button" class="detail-tab active" data-detail-tab="statement">Statement</button>
            <button type="button" class="detail-tab" data-detail-tab="attempts">Attempts</button>
            <button type="button" class="detail-tab" data-detail-tab="sources">Sources</button>
            <button type="button" class="detail-tab" data-detail-tab="graph">Graph</button>
            <button type="button" class="detail-tab" data-detail-tab="editor">Suggest edit</button>
          </div>

          <div class="detail-tab-panel active" data-detail-panel="statement">
            <div class="detail-card-grid">
              <article class="detail-block"><h4>Plain statement</h4><p>${escape(problem.plainStatement || problem.oneLine || '')}</p></article>
              <article class="detail-block"><h4>Why it matters</h4><p>${escape(problem.whyMatters || '')}</p></article>
              <article class="detail-block"><h4>Success condition</h4><p>${escape(problem.successCondition || '')}</p></article>
              <article class="detail-block"><h4>Current status</h4><p>${escape(problem.currentStatus || problem.status || '')}</p></article>
            </div>
          </div>

          <div class="detail-tab-panel" data-detail-panel="attempts">
            <article class="detail-block full"><h4>Tried methods / building blocks</h4><div class="chip-list">${(problem.buildingBlocks || []).map((block) => `<span class="chip">${escape(block)}</span>`).join('') || '<span class="chip">Not yet mapped</span>'}</div></article>
            <div class="detail-card-grid">
              <article class="detail-block"><h4>What worked</h4><div class="card-list">${(problem.partialResults || []).map((result) => `<div class="result-card"><span class="type">Partial result</span><h4>${escape(result.title)}</h4><p>${escape(result.body)}</p>${renderInlineSources(result.sources)}</div>`).join('') || '<span class="hint">No partial result cards yet.</span>'}</div></article>
              <article class="detail-block"><h4>What failed / where it stalled</h4><div class="card-list">${(problem.failures || []).map((failure) => `<div class="failure-card"><span class="type">${escape(failure.type)}</span><h4>${escape(failure.title)}</h4><p>${escape(failure.body)}</p>${renderInlineSources(failure.sources)}</div>`).join('') || '<span class="hint">No failure cards yet.</span>'}</div></article>
            </div>
          </div>

          <div class="detail-tab-panel" data-detail-panel="sources">
            <div class="detail-card-grid">
              ${renderQualityAudit(problem)}
              <article class="detail-block full"><h4>Primary citations</h4>${renderCitationBlocks(primarySourceIds, 'No primary citations yet.')}</article>
              <article class="detail-block full"><h4>Source trail</h4><div class="source-mini-list">${(problem.sources || []).map((id) => sourceCard(id)).join('') || '<span class="hint">No source trail yet.</span>'}</div></article>
            </div>
            ${renderIndependentSearchPanel(problem)}
          </div>

          <div class="detail-tab-panel" data-detail-panel="graph">
            <div class="detail-card-grid">
              <article class="detail-block"><h4>Direct relations</h4><div class="relation-list">${(problem.relations || []).map((relation) => { const target = problemById.get(relation.target); return `<a href="#${escape(relation.target)}" data-relation-target="${escape(relation.target)}">${escape((target && target.short) || relation.target)} · ${escape(relation.label)}</a>`; }).join('') || '<span class="hint">No direct relation edges yet.</span>'}</div></article>
              <article class="detail-block"><h4>Shared-method neighbors</h4><div class="relation-list">${sharedNeighbors.map((relation) => { const target = problemById.get(relation.target); return `<a href="#${escape(relation.target)}" data-relation-target="${escape(relation.target)}">${escape((target && target.short) || relation.target)} · ${escape(relation.label)}</a>`; }).join('') || '<span class="hint">No strong shared-method neighbors yet.</span>'}</div></article>
            </div>
            <button type="button" class="button primary detail-graph-jump" data-view="graph">Open graph view</button>
          </div>

          <div class="detail-tab-panel" data-detail-panel="editor">
            <article class="detail-block full editor-panel">
              <div>
                <h4>Suggest an edit</h4>
                <p class="hint">These notes are local to your browser session. They do not change the website.</p>
              </div>
              <div class="editor-grid">
                <label>Plain statement<textarea data-editor-field="plainStatement">${escape(problem.plainStatement || problem.oneLine || '')}</textarea></label>
                <label>Why it matters<textarea data-editor-field="whyMatters">${escape(problem.whyMatters || '')}</textarea></label>
                <label>Methods<textarea data-editor-field="buildingBlocks">${escape(methodText)}</textarea></label>
                <label>Partial result<textarea data-editor-field="partialResult">${escape(firstResult.body || '')}</textarea></label>
                <label>Where it stalls<textarea data-editor-field="failure">${escape(firstFailure.body || '')}</textarea></label>
                <label>Sources / notes<textarea data-editor-field="sourceNotes">${escape((problem.sources || []).map((id) => (sourceById.get(id) || {}).title || id).join('\n'))}</textarea></label>
              </div>
              <div class="editor-actions">
                <button type="button" class="button primary" data-editor-action="preview">Preview suggestion</button>
                <button type="button" class="button secondary" data-editor-action="json">Export JSON</button>
                <button type="button" class="button secondary" data-editor-action="markdown">Export note</button>
              </div>
              <pre class="editor-preview" id="editorPreview" aria-live="polite"></pre>
            </article>
          </div>
        </section>
      </div>`;
    els.detailPanel.querySelectorAll('[data-detail-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.detailTab;
        els.detailPanel.querySelectorAll('[data-detail-tab]').forEach((item) => item.classList.toggle('active', item === button));
        els.detailPanel.querySelectorAll('[data-detail-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.detailPanel === tab));
        typeset(els.detailPanel);
      });
    });
    els.detailPanel.querySelectorAll('[data-relation-target]').forEach((link) => {
      link.addEventListener('click', (event) => { event.preventDefault(); setActive(link.dataset.relationTarget, true); });
    });
    els.detailPanel.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => { hideDetail(); setView(button.dataset.view); });
    });
    els.detailPanel.querySelectorAll('[data-export]').forEach((button) => {
      button.addEventListener('click', () => {
        const slug = slugify(problem.name);
        if (button.dataset.export === 'markdown') downloadText(`${slug}.md`, exportMarkdown(problem), 'text/markdown');
        if (button.dataset.export === 'json') downloadText(`${slug}.json`, exportJson(problem), 'application/json');
        if (button.dataset.export === 'sources') downloadText(`${slug}-sources.txt`, exportSources(problem), 'text/plain');
      });
    });
    // Editor mode creates an exportable patch; it intentionally does not mutate the dataset.
    const editorPatch = () => {
      const get = (field) => {
        const input = els.detailPanel.querySelector(`[data-editor-field="${field}"]`);
        return input ? input.value.trim() : '';
      };
      const methods = get('buildingBlocks').split(',').map((item) => item.trim()).filter(Boolean);
      return {
        id: problem.id,
        name: problem.name,
        plainStatement: get('plainStatement'),
        whyMatters: get('whyMatters'),
        buildingBlocks: methods,
        partialResultNote: get('partialResult'),
        failureNote: get('failure'),
        sourceNotes: get('sourceNotes').split('\n').map((item) => item.trim()).filter(Boolean),
      };
    };
    const renderEditorPreview = () => {
      const preview = els.detailPanel.querySelector('#editorPreview');
      if (preview) preview.textContent = JSON.stringify(editorPatch(), null, 2);
    };
    els.detailPanel.querySelectorAll('[data-editor-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const patch = editorPatch();
        const slug = slugify(problem.name);
        if (button.dataset.editorAction === 'preview') renderEditorPreview();
        if (button.dataset.editorAction === 'json') downloadText(`${slug}-card-patch.json`, JSON.stringify(patch, null, 2), 'application/json');
        if (button.dataset.editorAction === 'markdown') {
          downloadText(`${slug}-editor-note.md`, `# ${problem.name}\n\n## Plain statement\n${patch.plainStatement}\n\n## Why it matters\n${patch.whyMatters}\n\n## Methods\n${patch.buildingBlocks.map((item) => `- ${item}`).join('\n') || '-'}\n\n## Partial result note\n${patch.partialResultNote}\n\n## Failure note\n${patch.failureNote}\n\n## Source notes\n${patch.sourceNotes.map((item) => `- ${item}`).join('\n') || '-'}\n`, 'text/markdown');
        }
      });
    });
    typeset(els.detailPanel);
  }

  // Failure taxonomy combines curated vocabulary with labels observed across cards.
  function renderTaxonomy() {
    if (!els.taxonomyGrid) return;
    const seen = new Set();
    const taxonomyItems = (data.taxonomy || [])
      .map((item) => ({
        name: cleanPublicText(item && item.name),
        description: cleanPublicText(item && item.description),
      }))
      .filter((item) => item.name && item.description)
      .filter((item) => {
        const key = normalize(item.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const failureTypes = new Map();
    const ignoredFailureLabels = new Set([
      'review gap',
      'review risk',
      'review protocol',
      'evidence gap',
      'core obstruction',
      'barrier',
    ]);
    (data.problems || []).forEach((problem) => (problem.failures || []).forEach((failure) => {
      const label = cleanPublicText(failure && failure.type) || 'Failure mode';
      if (ignoredFailureLabels.has(normalize(label))) return;
      failureTypes.set(label, (failureTypes.get(label) || 0) + 1);
    }));
    const topTypes = [...failureTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxTypeCount = Math.max(...topTypes.map((item) => item[1]), 1);
    const totalFailures = [...failureTypes.values()].reduce((sum, count) => sum + count, 0);
    els.taxonomyGrid.innerHTML = `
      <div class="taxonomy-overview">
        <article class="taxonomy-brief">
          <span class="mini-label">What this tab is</span>
          <h3>Failure modes describe why an attempted route stalls.</h3>
          <p>Use this page as the atlas legend: barrier theorem, computation wall, endpoint gap, proof-claim queue, counterexample lineage, and other labels that keep negative results searchable.</p>
        </article>
        <div class="taxonomy-stats">
          <article><span class="mini-label">Charted failures</span><strong>${totalFailures}</strong></article>
          <article><span class="mini-label">Vocabulary terms</span><strong>${taxonomyItems.length}</strong></article>
          <article><span class="mini-label">Observed labels</span><strong>${failureTypes.size}</strong></article>
        </div>
      </div>
      <section class="failure-mode-panel" aria-label="Most common failure labels">
        <div>
          <span class="mini-label">Observed in cards</span>
          <h3>Most common failure labels</h3>
        </div>
        <div class="failure-type-list">
          ${topTypes.map(([label, count]) => `<div class="failure-type-row"><span>${escape(label)}</span><div><i style="width:${Math.max(8, Math.round((count / maxTypeCount) * 100))}%"></i></div><strong>${count}</strong></div>`).join('')}
        </div>
      </section>
      <h3 class="taxonomy-subhead">Vocabulary</h3>
      <div class="taxonomy-card-grid">
        ${taxonomyItems.map((item) => `<article class="taxonomy-card"><h3>${escape(item.name)}</h3><p>${escape(item.description)}</p></article>`).join('')}
      </div>`;
  }
  // Source rendering uses the same store as card citations.
  function renderSources() {
    if (!els.sourceList) return;
    const query = normalize(sourceQuery);
    const sources = (data.sources || []).filter((source) => {
      const type = cleanPublicLabel(source.sourceType || 'source') || 'source';
      const matchesType = activeSourceType === 'all' || normalize(type) === activeSourceType;
      const haystack = normalize([source.title, source.note, source.url, type].join(' '));
      return matchesType && (!query || haystack.includes(query));
    });
    els.sourceList.innerHTML = sources.map((source) => {
      const reviewLabel = cleanPublicLabel(source.reviewCaveat || '');
      return `<article class="source-item"><h4>${escape(source.title)}</h4><p>${escape(source.note)}</p><div class="source-meta"><span>${escape(source.sourceType || 'source')}</span>${reviewLabel ? `<span>${escape(reviewLabel)}</span>` : ''}</div><a href="${escape(source.url)}" target="_blank" rel="noopener">Open source ↗</a></article>`;
    }).join('') || '<article class="source-item"><h4>No sources found</h4><p>Try another search or source type.</p></article>';
  }

  function renderSourceFilters() {
    if (!els.sourceTypeFilter) return;
    const types = [...new Set((data.sources || []).map((source) => cleanPublicLabel(source.sourceType || 'source')).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const current = activeSourceType;
    els.sourceTypeFilter.innerHTML = '<option value="all">All source types</option>' + types.map((type) => `<option value="${escape(normalize(type))}">${escape(type)}</option>`).join('');
    els.sourceTypeFilter.value = [...els.sourceTypeFilter.options].some((option) => option.value === current) ? current : 'all';
  }

  // Contribution preview builds a temporary card using the same renderer as real cards.
  function buildSubmissionProblem() {
    if (!els.contributionForm) return null;
    const form = new FormData(els.contributionForm);
    const name = String(form.get('problem') || '').trim() || 'Untitled problem';
    const attempt = String(form.get('attempt') || '').trim() || 'Attempt family pending';
    const domain = String(form.get('domain') || 'math');
    const survived = String(form.get('survived') || '').trim() || 'No surviving result recorded yet.';
    const stalled = String(form.get('stalled') || '').trim() || 'No obstruction recorded yet.';
    const review = String(form.get('review') || 'Source-backed').trim();
    const id = `submission_${slugify(name)}`;
    return {
      id,
      name,
      short: name,
      field: 'Submitted note',
      signal: '',
      oneLine: `${attempt}: ${stalled}`,
      plainStatement: name,
      whyMatters: 'This submitted card records an attempted route so the obstruction, surviving result, and source trail can be reviewed together.',
      successCondition: 'A reviewed card with precise statement, source trail, and checked failure and partial result wording.',
      currentStatus: review,
      status: review,
      tags: ['submission', attempt],
      buildingBlocks: [attempt],
      partialResults: [{ title: 'What survived', body: survived, sources: [] }],
      failures: [{ type: 'Submitted obstruction', title: 'Where it stalled', body: stalled, sources: [] }],
      relations: [],
      sources: [],
      statementSources: [],
      review: { stage: review, externalExpertReview: 'Pending' },
      domain: ['math', 'cs', 'physics'].includes(domain) ? domain : 'math',
    };
  }

  function renderSubmissionPreview() {
    if (!els.submissionPreview) return;
    const problem = buildSubmissionProblem();
    if (!problem) return;
    els.submissionPreview.innerHTML = `
      <span class="mini-label">Preview card</span>
      <h3>${escape(problem.name)}</h3>
      <p>${escape(problem.oneLine)}</p>
      <div class="coverage-strip compact"><span><strong>1</strong> method</span><span><strong>1</strong> partial</span><span><strong>1</strong> failure</span></div>
      <div class="submit-preview-actions">
        <button type="button" class="button primary" data-preview-action="open">Open dossier</button>
        <button type="button" class="button secondary" data-preview-action="markdown">Markdown</button>
        <button type="button" class="button secondary" data-preview-action="json">JSON</button>
      </div>`;
    els.submissionPreview.querySelectorAll('[data-preview-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const preview = buildSubmissionProblem();
        if (!preview) return;
        if (button.dataset.previewAction === 'markdown') downloadText(`${slugify(preview.name)}.md`, exportMarkdown(preview), 'text/markdown');
        if (button.dataset.previewAction === 'json') downloadText(`${slugify(preview.name)}.json`, exportJson(preview), 'application/json');
        if (button.dataset.previewAction === 'open') {
          const existing = problemById.get(preview.id);
          if (existing) Object.assign(existing, preview);
          else {
            data.problems.unshift(preview);
            preview._methodKeys = [...new Set([...(preview.buildingBlocks || []), ...(preview.tags || [])].map((x) => normalize(x)).filter(Boolean))];
            problemById.set(preview.id, preview);
          }
          renderStats();
          renderFeaturedProblems();
          renderProblemCards();
          setActive(preview.id, true);
        }
      });
    });
  }

  function getFilteredGraphProblems() {
    const query = normalize(graphQuery);
    return (data.problems || []).filter((problem) => {
      const matchesDomain = graphState.domain === 'all' || problem.domain === graphState.domain;
      const haystack = normalize([problem.name, problem.short, problem.field, problem.oneLine, ...(problem.tags || []), ...(problem.buildingBlocks || [])].join(' '));
      return matchesDomain && (!query || haystack.includes(query));
    });
  }
  function getNeighborhoodProblemSet() {
    const active = problemById.get(activeId);
    if (!active) return [];
    const byId = new Set([active.id]);
    (active.relations || []).forEach((relation) => byId.add(relation.target));
    getSharedNeighbors(active, 12).forEach((relation) => byId.add(relation.target));
    (data.problems || []).forEach((problem) => { if ((problem.relations || []).some((relation) => relation.target === active.id)) byId.add(problem.id); });
    const query = normalize(graphQuery);
    return (data.problems || []).filter((problem) => byId.has(problem.id)).filter((problem) => {
      const matchesDomain = graphState.domain === 'all' || problem.domain === graphState.domain;
      const haystack = normalize([problem.name, problem.short, problem.field, problem.oneLine, ...(problem.tags || []), ...(problem.buildingBlocks || [])].join(' '));
      return matchesDomain && (!query || haystack.includes(query));
    });
  }
  // Global graph layout: deterministic positions, explicit relations, and shared-method edges.
  function buildGraphNodesAndEdges() {
    const problems = graphState.neighborhoodOnly ? getNeighborhoodProblemSet() : getFilteredGraphProblems();
    const problemMap = new Map(problems.map((problem) => [problem.id, problem]));
    const domainList = graphState.domain === 'all' ? ['math', 'cs', 'physics'] : [graphState.domain];
    const width = graphState.domain === 'all' ? 1550 : 1200;
    const height = 920;
    const centers = {};
    domainList.forEach((domain, index) => {
      if (graphState.domain === 'all') centers[domain] = { x: [0.2, 0.5, 0.8][index] * width, y: height * 0.5, rx: domain === 'cs' ? 220 : 270, ry: domain === 'cs' ? 240 : 280 };
      else centers[domain] = { x: width * 0.5, y: height * 0.52, rx: 360, ry: 320 };
    });
    const nodes = [];
    domainList.forEach((domain) => {
      const center = centers[domain];
      const group = problems.filter((p) => p.domain === domain).sort((a, b) => a.name.localeCompare(b.name));
      group.forEach((problem, index) => {
        const angle = index * 2.399963229728653;
        const radius = Math.sqrt((index + 0.5) / Math.max(group.length, 1));
        nodes.push({ ...problem, x: center.x + Math.cos(angle) * center.rx * radius, y: center.y + Math.sin(angle) * center.ry * radius });
      });
    });
    const explicitEdges = [];
    const seen = new Set();
    problems.forEach((problem) => (problem.relations || []).forEach((relation) => {
      if (!problemMap.has(relation.target)) return;
      const key = [problem.id, relation.target].sort().join('::') + relation.label;
      if (!seen.has(key)) { seen.add(key); explicitEdges.push({ source: problem.id, target: relation.target, kind: 'explicit', label: relation.label }); }
    }));
    let sharedEdges = [];
    if (graphState.edgeMode !== 'explicit') {
      const candidates = [];
      for (let i = 0; i < problems.length; i += 1) {
        for (let j = i + 1; j < problems.length; j += 1) {
          const score = sharedScore(problems[i], problems[j]);
          if (score >= 2) candidates.push({ source: problems[i].id, target: problems[j].id, kind: 'shared', score });
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      sharedEdges = candidates.slice(0, graphState.neighborhoodOnly ? 120 : 260);
    }
    let edges = [];
    if (graphState.edgeMode === 'explicit') edges = explicitEdges;
    if (graphState.edgeMode === 'shared') edges = sharedEdges;
    if (graphState.edgeMode === 'both') edges = [...explicitEdges, ...sharedEdges];
    return { width, height, centers, nodes, edges };
  }
  function renderGlobalGraph() {
    if (!els.graphWrap) return;
    const { width, height, centers, nodes, edges } = buildGraphNodesAndEdges();
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    els.graphWrap.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Interactive relation graph of problem cards">
        ${Object.entries(centers).map(([domain, center]) => `<ellipse class="domain-zone ${domain}" cx="${center.x}" cy="${center.y}" rx="${center.rx + 70}" ry="${center.ry + 35}"></ellipse><text class="zone-label" x="${center.x}" y="90">${escape(domainLabel(domain))}</text>`).join('')}
        ${edges.map((edge) => { const source = nodeById.get(edge.source); const target = nodeById.get(edge.target); if (!source || !target) return ''; const active = source.id === activeId || target.id === activeId; return `<line class="graph-edge ${edge.kind} ${active ? 'active' : ''}" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" />`; }).join('')}
        ${nodes.map((node) => `<g class="graph-node ${node.domain} ${statusClass(node.status)} ${node.id === activeId ? 'active' : ''} ${graphState.showLabels ? 'show-labels' : ''}" data-id="${escape(node.id)}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="Open ${escape(node.name)}"><title>${escape(node.name)}</title><circle r="${node.id === activeId ? 8 : 4.8}"></circle><text class="node-label" y="-10">${escape(truncate(node.short || node.name, 20))}</text></g>`).join('')}
      </svg>`;
    els.graphWrap.querySelectorAll('.graph-node').forEach((node) => {
      node.addEventListener('click', () => { setActive(node.dataset.id, true); setView('graph'); });
      node.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive(node.dataset.id, true); setView('graph'); } });
    });
  }

  function setInspectorContent(type, payload, problem) {
    if (!els.attemptInspector || !problem) return;
    if (type === 'summary') {
      const sharedNeighbors = getSharedNeighbors(problem, 6);
      els.attemptInspector.innerHTML = `<div class="inspector-card"><span class="mini-label">Selected problem</span><h4>${escape(problem.name)}</h4><p>${escape(repairUnclosedMath(problem.oneLine))}</p><div class="coverage-strip compact"><span><strong>${(problem.buildingBlocks || []).length}</strong> tried</span><span><strong>${(problem.partialResults || []).length}</strong> worked</span><span><strong>${(problem.failures || []).length}</strong> failed</span><span><strong>${sharedNeighbors.length}</strong> similar</span></div><p class="hint">Click a node in the local explorer to inspect that method, result, failure, or neighboring problem.</p><button type="button" class="button small secondary" id="openCurrentCard">Open full card</button></div>`;
      const button = $('#openCurrentCard');
      if (button) button.addEventListener('click', () => openDetail());
      return;
    }
    if (type === 'problem-neighbor') {
      const neighbor = problemById.get(payload.target);
      if (!neighbor) return;
      els.attemptInspector.innerHTML = `<div class="inspector-card"><span class="mini-label">Neighboring card</span><h4>${escape(neighbor.name)}</h4><p>${escape(repairUnclosedMath(neighbor.oneLine))}</p><p><strong>Why shown:</strong> ${escape(payload.label)}</p><div class="relation-list"><button type="button" class="button small secondary" id="jumpToNeighbor">Open this problem</button></div></div>`;
      $('#jumpToNeighbor').addEventListener('click', () => setActive(neighbor.id, false));
      return;
    }
    els.attemptInspector.innerHTML = `<div class="inspector-card"><span class="mini-label">${escape(payload.kindLabel)}</span><h4>${escape(payload.title)}</h4><p>${escape(payload.body)}</p>${renderInlineSources(payload.sources)}</div>`;
  }

  // Local explorer shows one problem as a proof-history neighborhood.
  function renderAttemptGraph(problem) {
    if (!els.attemptGraphWrap || !problem) return;
    const width = 1160, height = 630, cx = 380, cy = 310;
    const methodNodes = (problem.buildingBlocks || []).slice(0, 8).map((label, index) => ({ id: `method-${index}`, title: label, body: `Tracked method or lens for ${problem.name}: ${label}.`, kind: 'method', kindLabel: 'Tried method', sources: problem.statementSources || problem.sources }));
    const partialNodes = (problem.partialResults || []).slice(0, 6).map((item, index) => ({ id: `partial-${index}`, title: item.title, body: item.body, kind: 'partial', kindLabel: 'What worked', sources: item.sources }));
    const failureNodes = (problem.failures || []).slice(0, 8).map((item, index) => ({ id: `failure-${index}`, title: item.title, body: item.body, kind: 'failure', kindLabel: 'What failed', sources: item.sources }));
    const neighborNodes = [...(problem.relations || []).slice(0, 5).map((relation, index) => ({ id: `relation-${index}`, target: relation.target, title: (problemById.get(relation.target) || {}).name || relation.target, label: relation.label, kind: 'problem-neighbor' })), ...getSharedNeighbors(problem, 4).map((relation, index) => ({ id: `shared-${index}`, target: relation.target, title: (problemById.get(relation.target) || {}).name || relation.target, label: relation.label, kind: 'problem-neighbor' }))].slice(0, 8);
    const place = (items, rx, ry, start, end) => items.map((item, index) => { const angle = items.length === 1 ? (start + end) / 2 : start + (index * (end - start)) / Math.max(items.length - 1, 1); return { ...item, x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry }; });
    const allNodes = [
      ...place(methodNodes, 240, 190, Math.PI * 1.12, Math.PI * 1.88),
      ...place(partialNodes, 300, 230, Math.PI * 0.94, Math.PI * 1.06),
      ...place(failureNodes, 320, 220, -0.14 * Math.PI, 0.14 * Math.PI),
      ...place(neighborNodes, 280, 220, 0.32 * Math.PI, 0.76 * Math.PI),
    ];
    if (els.attemptGraphTitle) els.attemptGraphTitle.textContent = `Explorer for ${problem.name}`;
    els.attemptGraphWrap.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Selected problem explorer"><text class="attempt-group-label" x="${cx}" y="42">Tried methods</text><text class="attempt-group-label" x="100" y="${cy}">What worked</text><text class="attempt-group-label" x="${width - 110}" y="${cy}">What failed</text><text class="attempt-group-label" x="${cx}" y="${height - 24}">Connected cards</text>${allNodes.map((node) => `<line class="attempt-edge ${node.kind}" x1="${cx}" y1="${cy}" x2="${node.x}" y2="${node.y}" />`).join('')}<g class="attempt-center ${problem.domain}"><circle cx="${cx}" cy="${cy}" r="86"></circle><text class="attempt-center-title" x="${cx}" y="${cy - 10}">${escape(truncate(problem.short || problem.name, 24))}</text><text class="attempt-center-subtitle" x="${cx}" y="${cy + 14}">${escape(domainLabel(problem.domain))}</text><text class="attempt-center-subtitle" x="${cx}" y="${cy + 34}">${escape(displayStatus(problem.status))}</text></g>${allNodes.map((node) => `<g class="attempt-node ${node.kind}" data-kind="${escape(node.kind)}" data-id="${escape(node.id)}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="${escape(node.title)}"><title>${escape(node.title)}</title><rect x="-92" y="-26" width="184" height="52" rx="16"></rect><text class="attempt-node-label" y="4">${escape(truncate(node.title, 28))}</text></g>`).join('')}</svg>`;
    const lookup = new Map(allNodes.map((node) => [node.id, node]));
    els.attemptGraphWrap.querySelectorAll('.attempt-node').forEach((nodeElement) => {
      const payload = lookup.get(nodeElement.dataset.id);
      const handler = () => payload.kind === 'problem-neighbor' ? setInspectorContent('problem-neighbor', payload, problem) : setInspectorContent('item', payload, problem);
      nodeElement.addEventListener('click', handler);
      nodeElement.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
    });
    setInspectorContent('summary', null, problem);
  }

  function selectedForceTypes() {
    const checked = $$('.force-type:checked').map((item) => item.value);
    return new Set(['problem', ...checked]);
  }
  function readableNodeType(type) {
    return { problem: 'Problem', method: 'Method / attempt', result: 'Partial result', failure: 'Failure / barrier', source: 'Source', bridge: 'Bridge family' }[type] || type;
  }
  function buildForceNeighborhood(problem) {
    const centerId = `problem:${problem.id}`;
    const depth = Number(els.forceDepth && els.forceDepth.value) || 2;
    const allowed = selectedForceTypes();
    const selected = new Set([centerId]);
    const typeCaps = { problem: 42, method: 52, result: 32, failure: 52, source: 28, bridge: 18 };
    const typeCounts = { problem: 1, method: 0, result: 0, failure: 0, source: 0 };
    const maxNodes = 145;
    function canAdd(node) {
      if (!node || !allowed.has(node.type)) return false;
      if (selected.has(node.id)) return true;
      if (selected.size >= maxNodes) return false;
      if ((typeCounts[node.type] || 0) >= (typeCaps[node.type] || 20)) return false;
      return true;
    }
    function addNode(nodeId, next) {
      const node = graphNodeById.get(nodeId);
      if (!canAdd(node)) return;
      if (!selected.has(nodeId)) {
        selected.add(nodeId);
        typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
        if (next) next.add(nodeId);
      }
    }
    let frontier = new Set([centerId]);
    for (let hop = 0; hop < depth; hop += 1) {
      const next = new Set();
      frontier.forEach((nodeId) => {
        (graphAdjacency.get(nodeId) || [])
          .sort((a, b) => {
            const at = (graphNodeById.get(a.other) || {}).type || '';
            const bt = (graphNodeById.get(b.other) || {}).type || '';
            const order = { bridge: 0, method: 1, result: 2, failure: 3, problem: 4, source: 5 };
            return (order[at] || 9) - (order[bt] || 9);
          })
          .forEach((edge) => addNode(edge.other, next));
      });
      frontier = next;
      if (!frontier.size) break;
    }
    if (allowed.has('source')) {
      (problem.sources || []).slice(0, 10).forEach((sid) => addNode(`source:${sid}`, null));
    }
    const nodes = [...selected].map((id) => graphNodeById.get(id)).filter(Boolean);
    const nodeSet = new Set(nodes.map((node) => node.id));
    const edges = (graphModel.edges || []).filter((edge) => nodeSet.has(edge.source) && nodeSet.has(edge.target)).slice(0, 320);
    return { nodes, edges };
  }
  function initialForcePositions(nodes, width, height) {
    const centerTypeOffsets = { problem: 0, bridge: -2.7, method: -1.9, result: 2.7, failure: -0.15, source: 1.35 };
    const countByType = {};
    nodes.forEach((node) => { countByType[node.type] = (countByType[node.type] || 0) + 1; });
    const indexByType = {};
    nodes.forEach((node, index) => {
      indexByType[node.type] = indexByType[node.type] || 0;
      const localIndex = indexByType[node.type]++;
      if (node.id === `problem:${activeId}`) {
        node.x = width / 2; node.y = height / 2; node.fixed = true; return;
      }
      const total = countByType[node.type] || 1;
      const angle = centerTypeOffsets[node.type] + (localIndex / Math.max(total, 1)) * Math.PI * 1.55;
      const radius = node.type === 'source' ? 330 : node.type === 'bridge' ? 180 : node.type === 'problem' ? 285 : node.type === 'failure' ? 270 : 235;
      node.x = width / 2 + Math.cos(angle) * radius + ((index % 7) - 3) * 4;
      node.y = height / 2 + Math.sin(angle) * radius * 0.72 + ((index % 5) - 2) * 5;
      node.vx = 0; node.vy = 0;
    });
  }
  function runForce(nodes, edges, width, height, iterations = 120) {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const degrees = new Map();
    edges.forEach((edge) => { degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1); degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1); });
    nodes.forEach((node) => { node.degree = degrees.get(node.id) || 0; node.r = node.type === 'problem' ? 12 : node.type === 'bridge' ? 11 : node.type === 'source' ? 7 : 9; node.vx = node.vx || 0; node.vy = node.vy || 0; });
    for (let t = 0; t < iterations; t += 1) {
      const alpha = 1 - t / iterations;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i], b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 16) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist2 = 16; }
          const dist = Math.sqrt(dist2);
          const force = Math.min(2200 / dist2, 4) * alpha;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          if (!a.fixed) { a.vx -= fx; a.vy -= fy; }
          if (!b.fixed) { b.vx += fx; b.vy += fy; }
        }
      }
      edges.forEach((edge) => {
        const a = byId.get(edge.source), b = byId.get(edge.target);
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desired = edge.type === 'cites' ? 120 : 155;
        const force = (dist - desired) * 0.012 * alpha;
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        if (!a.fixed) { a.vx += fx; a.vy += fy; }
        if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
      });
      nodes.forEach((node) => {
        if (!node.fixed) {
          node.vx += (width / 2 - node.x) * 0.0012 * alpha;
          node.vy += (height / 2 - node.y) * 0.0012 * alpha;
          node.vx *= 0.82; node.vy *= 0.82;
          node.x += node.vx; node.y += node.vy;
          node.x = Math.max(30, Math.min(width - 30, node.x));
          node.y = Math.max(30, Math.min(height - 30, node.y));
        }
      });
    }
  }
  function forceNodeHtml(node) {
    const r = node.type === 'problem' ? 12 : node.type === 'bridge' ? 11 : node.type === 'source' ? 7 : 9;
    return `<g class="force-node ${node.type} ${node.id === forceState.selectedNodeId ? 'active' : ''}" data-id="${escape(node.id)}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button"><title>${escape(node.label)}</title><circle r="${r}"></circle><text y="-${r + 5}">${escape(truncate(node.short || node.label, 28))}</text></g>`;
  }
  function forceEdgeHtml(edge) {
    const a = forceState.nodeById.get(edge.source), b = forceState.nodeById.get(edge.target);
    if (!a || !b) return '';
    return `<line class="force-edge ${escape(edge.type)}" data-source="${escape(edge.source)}" data-target="${escape(edge.target)}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><title>${escape(edge.label || edge.type)}</title></line>`;
  }
  function updateForceDom() {
    if (!forceState.svg) return;
    forceState.svg.querySelectorAll('.force-edge').forEach((line) => {
      const a = forceState.nodeById.get(line.dataset.source), b = forceState.nodeById.get(line.dataset.target);
      if (!a || !b) return;
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y); line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    });
    forceState.svg.querySelectorAll('.force-node').forEach((nodeEl) => {
      const node = forceState.nodeById.get(nodeEl.dataset.id);
      if (node) nodeEl.setAttribute('transform', `translate(${node.x} ${node.y})`);
    });
  }
  function renderForceInspector(nodeId) {
    if (!els.forceInspector) return;
    const node = graphNodeById.get(nodeId);
    if (!node) {
      els.forceInspector.innerHTML = `<div class="inspector-card"><h4>Graph inspector</h4><p>Click nodes to explore the local problem neighborhood.</p></div>`;
      return;
    }
    const problemId = node.type === 'problem' ? node.id.replace(/^problem:/, '') : null;
    const problem = problemId ? problemById.get(problemId) : null;
    const source = node.type === 'source' ? sourceById.get(node.id.replace(/^source:/, '')) : null;
    if (node.type === 'bridge') {
      const bridgeId = node.id.replace(/^bridge:/, '');
      const bridge = (data.bridgeAtlas || []).find((item) => item.id === bridgeId);
      const linked = (bridge && bridge.problemIds || []).map((id) => problemById.get(id)).filter(Boolean);
      const sample = linked.slice(0, 12).map((item) => `<button type="button" class="bridge-problem-chip" data-bridge-problem="${escape(item.id)}"><span>${escape(item.short || item.name)}</span><em>${escape(domainLabel(item.domain))}</em></button>`).join('');
      els.forceInspector.innerHTML = `<div class="inspector-card force-node-card bridge"><span class="mini-label">Bridge family</span><h4>${escape(node.label)}</h4><p>${escape(node.summary || '')}</p><div class="coverage-strip compact"><span><strong>${linked.length}</strong> linked problems</span><span><strong>${(bridge && bridge.counts && bridge.counts.math) || 0}</strong> math</span><span><strong>${(bridge && bridge.counts && bridge.counts.cs) || 0}</strong> CS</span><span><strong>${(bridge && bridge.counts && bridge.counts.physics) || 0}</strong> physics</span></div><div class="bridge-chip-list">${sample}</div></div>`;
      els.forceInspector.querySelectorAll('[data-bridge-problem]').forEach((button) => button.addEventListener('click', () => setActive(button.dataset.bridgeProblem, true)));
      return;
    }
    els.forceInspector.innerHTML = `<div class="inspector-card force-node-card ${escape(node.type)}"><span class="mini-label">${escape(readableNodeType(node.type))}</span><h4>${escape(node.label)}</h4><p>${escape(repairUnclosedMath(node.summary || node.body || (problem && problem.oneLine) || ''))}</p>${source ? `<a class="source-link" href="${escape(source.url)}" target="_blank" rel="noopener">Open source ↗</a>` : ''}${problem ? `<button type="button" class="button small secondary" id="openForceProblem">Open problem card</button>` : ''}</div>`;
    const button = $('#openForceProblem');
    if (button && problem) button.addEventListener('click', () => setActive(problem.id, true));
  }
  function svgPoint(svg, event) {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX; pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  // Force graph is small enough to run without a library and supports direct node dragging.
  function renderForceGraph(problem, restart = true) {
    if (!els.forceGraphWrap || !problem || !graphModel.nodes) return;
    const width = 1180, height = 660;
    const { nodes: rawNodes, edges: rawEdges } = buildForceNeighborhood(problem);
    const nodes = rawNodes.map((node) => ({ ...node }));
    const edges = rawEdges.map((edge) => ({ ...edge }));
    initialForcePositions(nodes, width, height);
    runForce(nodes, edges, width, height, restart ? 125 : 55);
    forceState = { ...forceState, nodes, edges, nodeById: new Map(nodes.map((node) => [node.id, node])), selectedNodeId: `problem:${problem.id}` };
    els.forceGraphWrap.innerHTML = `<svg class="force-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Draggable first-class graph">${edges.map(forceEdgeHtml).join('')}${nodes.map(forceNodeHtml).join('')}</svg>`;
    forceState.svg = els.forceGraphWrap.querySelector('svg');
    forceState.svg.querySelectorAll('.force-node').forEach((nodeEl) => {
      const inspect = () => {
        forceState.selectedNodeId = nodeEl.dataset.id;
        forceState.svg.querySelectorAll('.force-node').forEach((item) => item.classList.toggle('active', item.dataset.id === forceState.selectedNodeId));
        renderForceInspector(forceState.selectedNodeId);
      };
      nodeEl.addEventListener('click', inspect);
      nodeEl.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(); } });
      nodeEl.addEventListener('pointerdown', (event) => {
        const node = forceState.nodeById.get(nodeEl.dataset.id);
        if (!node) return;
        event.preventDefault();
        forceState.dragging = node;
        node.fixed = true;
        const p = svgPoint(forceState.svg, event);
        node.x = p.x; node.y = p.y;
        nodeEl.setPointerCapture(event.pointerId);
        inspect();
        updateForceDom();
      });
      nodeEl.addEventListener('pointermove', (event) => {
        if (!forceState.dragging || forceState.dragging.id !== nodeEl.dataset.id) return;
        const p = svgPoint(forceState.svg, event);
        forceState.dragging.x = Math.max(25, Math.min(width - 25, p.x));
        forceState.dragging.y = Math.max(25, Math.min(height - 25, p.y));
        updateForceDom();
      });
      nodeEl.addEventListener('pointerup', () => { forceState.dragging = null; });
      nodeEl.addEventListener('pointerleave', () => { if (forceState.dragging && forceState.dragging.id === nodeEl.dataset.id) forceState.dragging = null; });
    });
    renderForceInspector(forceState.selectedNodeId);
  }

  let selectedBridgeId = null;
  // Bridge matrix groups methods that recur across mathematics, CS, and physics.
  function renderBridgeMatrix() {
    if (!els.bridgeFamilyGrid || !data.bridgeAtlas) return;
    const bridges = [...data.bridgeAtlas].sort((a, b) => (b.problemIds || []).length - (a.problemIds || []).length);
    if (!selectedBridgeId && bridges.length) selectedBridgeId = bridges[0].id;
    if (els.bridgeSelect) {
      els.bridgeSelect.innerHTML = bridges.map((bridge) => `<option value="${escape(bridge.id)}" ${bridge.id === selectedBridgeId ? 'selected' : ''}>${escape(bridge.label)}</option>`).join('');
    }
    const crossOnly = !els.bridgeOnlyCrossDomain || els.bridgeOnlyCrossDomain.checked;
    const cardBridges = crossOnly ? bridges.filter((bridge) => (['math','cs','physics'].filter((d) => (bridge.counts && bridge.counts[d]) > 0).length >= 2)) : bridges;
    els.bridgeFamilyGrid.innerHTML = cardBridges.map((bridge) => {
      const domains = ['math','cs','physics'].map((d) => `<span class="domain-pill ${d}">${escape(domainLabel(d))}: ${(bridge.counts && bridge.counts[d]) || 0}</span>`).join('');
      return `<article class="bridge-family-card ${bridge.id === selectedBridgeId ? 'active' : ''}" data-bridge-id="${escape(bridge.id)}" tabindex="0" role="button"><h4>${escape(bridge.label)}</h4><p>${escape(bridge.summary)}</p><div class="meta-row">${domains}</div><div class="coverage-strip compact"><span><strong>${(bridge.problemIds || []).length}</strong> cards</span><span><strong>${(bridge.counts && bridge.counts.open) || 0}</strong> open</span><span><strong>${(bridge.counts && bridge.counts.solved) || 0}</strong> solved</span><span><strong>${(bridge.counts && bridge.counts.disproved) || 0}</strong> disproved</span></div></article>`;
    }).join('');
    els.bridgeFamilyGrid.querySelectorAll('.bridge-family-card').forEach((card) => {
      const handler = () => { selectedBridgeId = card.dataset.bridgeId; renderBridgeMatrix(); };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
    });
    renderBridgeInspector();
  }
  function renderBridgeInspector() {
    if (!els.bridgeInspector || !data.bridgeAtlas) return;
    const bridge = (data.bridgeAtlas || []).find((item) => item.id === selectedBridgeId) || data.bridgeAtlas[0];
    if (!bridge) return;
    const linked = (bridge.problemIds || []).map((id) => problemById.get(id)).filter(Boolean);
    const examples = linked.slice(0, 18).map((problem) => {
      const firstFailure = (problem.failures || [])[0];
      const firstResult = (problem.partialResults || [])[0];
      return `<article class="bridge-linked-problem" data-bridge-problem="${escape(problem.id)}" tabindex="0" role="button"><div class="status-row"><span class="status-pill ${statusClass(problem.status)}">${escape(displayStatus(problem.status))}</span><span class="domain-pill ${problem.domain}">${escape(domainLabel(problem.domain))}</span></div><h4>${escape(problem.name)}</h4><p><strong>Worked:</strong> ${escape(truncate(firstResult && firstResult.title || 'partial trail pending', 90))}</p><p><strong>Failed:</strong> ${escape(truncate(firstFailure && firstFailure.title || 'failure trail pending', 90))}</p></article>`;
    }).join('');
    els.bridgeInspector.innerHTML = `<div class="inspector-card"><span class="mini-label">Selected bridge</span><h4>${escape(bridge.label)}</h4><p>${escape(bridge.summary)}</p><div class="coverage-strip"><span><strong>${linked.length}</strong> linked problem cards</span><span><strong>${(bridge.counts && bridge.counts.math) || 0}</strong> math</span><span><strong>${(bridge.counts && bridge.counts.cs) || 0}</strong> CS</span><span><strong>${(bridge.counts && bridge.counts.physics) || 0}</strong> physics</span></div><h4>Worked / failed examples</h4><div class="bridge-linked-list">${examples}</div>${renderInlineSources(bridge.sourceIds || [])}</div>`;
    els.bridgeInspector.querySelectorAll('[data-bridge-problem]').forEach((card) => {
      const handler = () => setActive(card.dataset.bridgeProblem, true);
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
    });
  }

  // Timeline groups repeated events so one milestone can point to many cards.
  function renderTimeline() {
    if (!els.timelineGrid) return;
    const rawEvents = (data.timelineEvents || []).filter((event) => activeTimelineDomain === 'all' || event.domain === activeTimelineDomain);
    const grouped = new Map();
    rawEvents.forEach((event) => {
      const key = [event.year, event.title, event.domain, event.summary].join('::');
      if (!grouped.has(key)) grouped.set(key, { ...event, problemIds: [], sourceIds: [] });
      const group = grouped.get(key);
      if (event.problemId) group.problemIds.push(event.problemId);
      group.sourceIds.push(...(event.sourceIds || []));
      group.status = event.eventType || event.status || group.status;
    });
    const events = [...grouped.values()].map((event) => ({
      ...event,
      problemIds: [...new Set(event.problemIds)],
      sourceIds: [...new Set(event.sourceIds)],
    })).sort((a, b) => Number(a.year) - Number(b.year));
    els.timelineGrid.innerHTML = events.map((event) => {
      const problems = event.problemIds.map((id) => problemById.get(id)).filter(Boolean);
      const chips = problems.slice(0, 5).map((problem) => `<button type="button" class="timeline-problem-chip" data-problem-id="${escape(problem.id)}">${escape(problem.short || problem.name)}</button>`).join('');
      const more = problems.length > 5 ? `<span class="chip">+${problems.length - 5} more</span>` : '';
      const firstProblem = problems[0];
      return `<article class="timeline-card ${escape(event.domain || '')}" ${firstProblem ? `data-problem-id="${escape(firstProblem.id)}"` : ''} tabindex="0" role="button"><span class="timeline-year">${escape(event.year)}</span><h3>${escape(event.title)}</h3><p>${escape(event.summary)}</p><div class="status-row"><span class="status-pill ${statusClass(event.status)}">${escape(event.status || 'milestone')}</span><span class="domain-pill ${escape(event.domain || '')}">${escape(domainLabel(event.domain))}</span></div>${chips || more ? `<div class="timeline-chip-row">${chips}${more}</div>` : ''}${renderInlineSources(event.sourceIds)}</article>`;
    }).join('');
    els.timelineGrid.querySelectorAll('.timeline-problem-chip').forEach((chip) => {
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        if (problemById.has(chip.dataset.problemId)) setActive(chip.dataset.problemId, true);
      });
    });
    els.timelineGrid.querySelectorAll('.timeline-card[data-problem-id]').forEach((card) => {
      const handler = () => { if (problemById.has(card.dataset.problemId)) setActive(card.dataset.problemId, true); };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
    });
  }

  function openDetail() {
    detailOpen = true;
    if (!els.detailOverlay) return;
    els.detailOverlay.classList.add('open');
    els.detailOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (els.closeDetail) els.closeDetail.focus({ preventScroll: true });
  }
  function hideDetail() {
    detailOpen = false;
    if (!els.detailOverlay) return;
    els.detailOverlay.classList.remove('open');
    els.detailOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  function refreshGraphViews(restartForce = false) {
    const problem = problemById.get(activeId);
    renderGlobalGraph();
    renderAttemptGraph(problem);
    renderForceGraph(problem, restartForce);
    renderBridgeMatrix();
  }
  function setView(view) {
    const viewPanels = $$('[data-view-panel]');
    const validViews = new Set(viewPanels.map((panel) => panel.dataset.viewPanel));
    const nextView = validViews.has(view) ? view : 'overview';
    viewPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === nextView));
    $$('[data-view]').forEach((trigger) => trigger.classList.toggle('active', trigger.dataset.view === nextView));
    if (nextView === 'graph') { refreshGraphViews(true); renderBridgeMatrix(); }
    if (nextView === 'timeline') renderTimeline();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function setDomain(domain) {
    activeDomain = domain;
    $$('.domain-filter').forEach((button) => button.classList.toggle('active', button.dataset.domain === domain));
    renderProblemCards();
  }
  function publicHashForProblem(problem) {
    if (!problem) return 'cards';
    return /^ulam_\d+$/i.test(problem.id) ? slugify(problem.name) : problem.id;
  }
  // Selecting a card and opening a modal are separate so page loads do not surprise-open a card.
  function setActive(id, shouldOpen = false, updateHash = shouldOpen) {
    if (!problemById.has(id)) return;
    activeId = id;
    const problem = problemById.get(id);
    if (els.modalTitle) els.modalTitle.textContent = problem.name;
    renderDetail(problem);
    renderProblemCards();
    if ($('#graphView') && $('#graphView').classList.contains('active')) refreshGraphViews(true);
    if ($('#timelineView') && $('#timelineView').classList.contains('active')) renderTimeline();
    if (updateHash) history.replaceState(null, '', `#${publicHashForProblem(problem)}`);
    if (shouldOpen) openDetail();
    typeset(document.body);
  }

  if (els.search) els.search.addEventListener('input', renderProblemCards);
  $$('.filter').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; $$('.filter').forEach((item) => item.classList.toggle('active', item === button)); renderProblemCards(); }));
  $$('.domain-filter').forEach((button) => button.addEventListener('click', () => setDomain(button.dataset.domain)));
  $$('[data-view]').forEach((trigger) => trigger.addEventListener('click', () => setView(trigger.dataset.view)));
  $$('[data-domain-target]').forEach((button) => button.addEventListener('click', () => { setDomain(button.dataset.domainTarget); setView(button.dataset.viewTarget || 'cards'); }));
  $$('.timeline-filter').forEach((button) => button.addEventListener('click', () => { activeTimelineDomain = button.dataset.timelineDomain; $$('.timeline-filter').forEach((item) => item.classList.toggle('active', item === button)); renderTimeline(); }));
  if (els.graphDomainSelect) els.graphDomainSelect.addEventListener('change', () => { graphState.domain = els.graphDomainSelect.value; renderGlobalGraph(); });
  if (els.graphEdgeModeSelect) els.graphEdgeModeSelect.addEventListener('change', () => { graphState.edgeMode = els.graphEdgeModeSelect.value; renderGlobalGraph(); });
  if (els.graphNeighborhoodCheckbox) els.graphNeighborhoodCheckbox.addEventListener('change', () => { graphState.neighborhoodOnly = els.graphNeighborhoodCheckbox.checked; renderGlobalGraph(); });
  if (els.graphLabelsCheckbox) els.graphLabelsCheckbox.addEventListener('change', () => { graphState.showLabels = els.graphLabelsCheckbox.checked; renderGlobalGraph(); });
  if (els.graphSearch) els.graphSearch.addEventListener('input', () => { graphQuery = els.graphSearch.value; renderGlobalGraph(); });
  if (els.sourceSearch) els.sourceSearch.addEventListener('input', () => { sourceQuery = els.sourceSearch.value; renderSources(); });
  if (els.sourceTypeFilter) els.sourceTypeFilter.addEventListener('change', () => { activeSourceType = els.sourceTypeFilter.value; renderSources(); });
  if (els.prepareCardButton) els.prepareCardButton.addEventListener('click', renderSubmissionPreview);
  if (els.contributionForm) els.contributionForm.addEventListener('input', () => {
    if (els.submissionPreview && els.submissionPreview.innerHTML.trim()) renderSubmissionPreview();
  });
  if (els.forceRestart) els.forceRestart.addEventListener('click', () => renderForceGraph(problemById.get(activeId), true));
  if (els.forceDepth) els.forceDepth.addEventListener('change', () => renderForceGraph(problemById.get(activeId), true));
  $$('.force-type').forEach((checkbox) => checkbox.addEventListener('change', () => renderForceGraph(problemById.get(activeId), true)));
  if (els.bridgeSelect) els.bridgeSelect.addEventListener('change', () => { selectedBridgeId = els.bridgeSelect.value; renderBridgeMatrix(); });
  if (els.bridgeOnlyCrossDomain) els.bridgeOnlyCrossDomain.addEventListener('change', renderBridgeMatrix);
  if (els.closeDetail) els.closeDetail.addEventListener('click', hideDetail);
  if (els.detailOverlay) els.detailOverlay.addEventListener('click', (event) => { if (event.target === els.detailOverlay) hideDetail(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && detailOpen) hideDetail(); });
  window.addEventListener('load', () => typeset(document.body));

  renderStats();
  renderFeaturedProblems();
  renderTaxonomy();
  renderSourceFilters();
  renderSources();
  renderProblemCards();
  renderSubmissionPreview();
  renderTimeline();
  renderBridgeMatrix();
  if (activeId) setActive(activeId, false, false);
  if (initialView) setView(initialView);
  loadUlamIntoAtlas();
})();
