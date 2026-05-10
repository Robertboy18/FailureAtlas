(() => {
  // Dedicated domain page controller for Mathematics, Computer Science, and Physics.
  const data = window.FAILURE_ATLAS_DATA;
  const domain = document.body.dataset.domain || 'math';
  const titleByDomain = { math: 'Mathematics', cs: 'Computer Science', physics: 'Physics' };
  const imageByDomain = { math: 'assets/category-math.png', cs: 'assets/category-cs.png', physics: 'assets/category-physics.png' };
  const escape = (value) => String(value == null ? '' : value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  // Keep generated/import wording out of the domain-card UI.
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
  const skipCleanKeys = new Set(['id','url','href','src','domain','target','problemId','sourceId','sources','sourceIds','statementSources','problemIds','cardMath','math','formula','image','type','kind']);
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
  [data.problems, data.sources, data.timelineEvents, data.bridgeAtlas, (data.graphModel || data.graph || {}).nodes, (data.graphModel || data.graph || {}).edges]
    .filter(Boolean)
    .forEach((items) => cleanAtlasTextFields(items));
  const normalize = (value) => String(value || '').toLowerCase();
  const truncate = (value, length = 28) => {
    const text = String(value || '');
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  };
  function repairUnclosedMath(value) {
    let text = String(value || '');
    if ((text.match(/\$/g) || []).length % 2 === 1) text = `${text.slice(0, text.lastIndexOf('$')).trimEnd()}…`;
    if ((text.match(/\\\(/g) || []).length > (text.match(/\\\)/g) || []).length) text = `${text.slice(0, text.lastIndexOf('\\(')).trimEnd()}…`;
    if ((text.match(/\\\[/g) || []).length > (text.match(/\\\]/g) || []).length) text = `${text.slice(0, text.lastIndexOf('\\[')).trimEnd()}…`;
    return text.replace(/\s+…$/, '…');
  }
  const typeset = (root = document.body) => {
    if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([root]).catch(() => {});
  };
  window.addEventListener('load', () => typeset(document.body));

  // Formula extraction mirrors the main atlas so domain pages render math consistently.
  function normalizeFormula(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^\\\[/.test(text) || /^\\\(/.test(text) || /^\$/.test(text)) return text;
    return `\\[${text}\\]`;
  }
  function extractDelimitedMath(text) {
    const value = String(text || '');
    const snippets = [];
    const patterns = [/\\\[([\s\S]*?)\\\]/g, /\\\(([\s\S]*?)\\\)/g, /\$([^$\n]{1,140})\$/g];
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
    const value = String(text || '').replace(/\s+/g, ' ');
    const between = value.match(/\bprobability\s+between\s+([0-9]+\/[0-9]+)\s+and\s+([0-9]+\/[0-9]+)/i);
    if (between) return `<span class="formula-text">probability ∈ [${escape(between[1])}, ${escape(between[2])}]</span>`;
    const clauses = value.split(/(?<=[.!?])\s+|;\s+|,\s+(?=(?:and|with|where|when)\b)/i).map((item) => item.trim()).filter(Boolean);
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
  function formulaHtml(problem) {
    const direct = problem && (problem.math || problem.cardMath);
    if (direct) return `<div class="formula-line">${normalizeFormula(direct)}</div>`;
    const fields = [problem && problem.oneLine, problem && problem.plainStatement, problem && problem.successCondition];
    for (const field of fields) {
      const math = extractDelimitedMath(field);
      if (math) return `<div class="formula-line">${math}</div>`;
    }
    for (const field of fields) {
      const math = extractSymbolFormula(field);
      if (math) return `<div class="formula-line">${math}</div>`;
    }
    return '';
  }
  function inferDomain(problem) {
    const hay = normalize([problem.field, problem.name, ...(problem.tags || []), ...(problem.buildingBlocks || [])].join(' '));
    const physicsKeys = ['physics','cosmology','astronomy','astrophysics','particle','condensed matter','superconduct','dark matter','dark energy','qcd','quantum gravity','black hole','gravit','neutrino','plasma','climate'];
    const csKeys = ['computer science','complexity','algorithm','cryptography','logic','computation','quantum computing','machine learning','formal verification','proof complexity','circuit','approximation','parameterized','streaming','online matching'];
    if (physicsKeys.some((key) => hay.includes(key))) return 'physics';
    if (csKeys.some((key) => hay.includes(key))) return 'cs';
    return 'math';
  }
  const statusClass = (status) => {
    const v = String(status || '').toLowerCase();
    if (v.includes('disproved') || v.includes('false')) return 'disproved';
    if (v.includes('solved') && !v.includes('unsolved') && !v.includes('open')) return 'solved';
    return 'unsolved';
  };
  const displayStatus = (status) => {
    const v = String(status || '').toLowerCase();
    if (v.includes('disputed') || v.includes('claim')) return 'Disputed';
    if (v.includes('disproved') || v.includes('false')) return 'Disproved';
    if (v.includes('solved') && !v.includes('unsolved') && !v.includes('open')) return 'Solved';
    if (v.includes('open') || v.includes('unsolved') || v.includes('active')) return 'Open';
    if (v.includes('independent')) return 'Independent';
    if (v.includes('foundational')) return 'Assumption';
    if (v.includes('program')) return 'Program';
    if (v.includes('partial')) return 'Partial';
    return truncate(cleanPublicText(status || 'Open'), 28);
  };
  const sourceById = new Map((data.sources || []).map((s) => [s.id, s]));
  const problems = (data.problems || []).map((p) => ({ ...p, domain: p.domain || inferDomain(p) })).filter((p) => p.domain === domain).sort((a,b)=>a.name.localeCompare(b.name));
  const graph = data.graphModel || data.graph || {nodes:[], edges:[], timeline:[]};
  const timelineEvents = data.timelineEvents || graph.timeline || [];
  const graphNodeById = new Map((graph.nodes || []).map((n)=>[n.id,n]));

  const $ = (id) => document.getElementById(id);
  const domainTitle = $('domainTitle');
  const domainImage = $('domainImage');
  const domainCount = $('domainCount');
  const domainFailureCount = $('domainFailureCount');
  const domainSourceCount = $('domainSourceCount');
  const domainCards = $('domainCards');
  const domainTimeline = $('domainTimeline');
  const domainGraph = $('domainGraph');
  const domainSearch = $('domainSearch');
  const domainStatus = $('domainStatus');
  const detailOverlay = $('domainDetailOverlay');
  const detailPanel = $('domainDetailPanel');
  const modalTitle = $('domainModalTitle');
  const closeDetail = $('closeDomainDetail');

  if (domainTitle) domainTitle.textContent = `${titleByDomain[domain]} Atlas`;
  if (domainImage) domainImage.src = imageByDomain[domain];
  if (domainCount) domainCount.textContent = problems.length;
  if (domainFailureCount) domainFailureCount.textContent = problems.reduce((s,p)=>s+(p.failures||[]).length,0);
  if (domainSourceCount) domainSourceCount.textContent = new Set(problems.flatMap((p)=>p.sources||[])).size;

  function sourceLinks(ids=[]) {
    return ids.map((id)=>sourceById.get(id)).filter(Boolean).slice(0,3).map((s)=>`<a class="source-link" href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)} ↗</a>`).join('');
  }
  function renderInlineSources(ids=[]) {
    const links = sourceLinks(ids);
    return links ? `<div class="inline-sources"><span>Cites</span>${links}</div>` : '';
  }
  const problemById = new Map(problems.map((p)=>[p.id,p]));

  // Domain cards open in-place, using the same modal pattern as the main atlas.
  function openDetail(problem) {
    if (!problem || !detailOverlay || !detailPanel) return;
    if (modalTitle) modalTitle.textContent = problem.name;
    detailPanel.innerHTML = `
      <div class="detail-hero">
        <article class="detail-title-card">
          <div>
            <div class="status-row"><span class="status-pill ${statusClass(problem.status)}">${escape(displayStatus(problem.status))}</span><span class="domain-pill ${problem.domain}">${escape(titleByDomain[domain])}</span></div>
            <h3>${escape(problem.name)}</h3>
            ${formulaHtml(problem).replace('formula-line', 'detail-formula')}
            <p>${escape(repairUnclosedMath(problem.oneLine))}</p>
          </div>
          <div class="chip-list">${(problem.tags || []).slice(0,10).map((tag)=>`<span class="chip">${escape(tag)}</span>`).join('')}</div>
        </article>
        <article class="detail-statement-card">
          <div><h4>Plain statement</h4><p>${escape(problem.plainStatement || problem.oneLine || '')}</p></div>
          <div><h4>Why it matters</h4><p>${escape(problem.whyMatters || 'Context still needs a tighter editorial pass.')}</p></div>
          <div><h4>Success condition</h4><p>${escape(problem.successCondition || 'An accepted proof, counterexample, or classification.')}</p></div>
          <div><h4>Current status</h4><p>${escape(cleanPublicText(problem.currentStatus || problem.status || 'Open'))}</p></div>
          <div><h4>Statement / status citations</h4>${renderInlineSources(problem.statementSources || problem.sources)}</div>
          <div><h4>Coverage snapshot</h4><div class="coverage-strip"><span><strong>${(problem.buildingBlocks || []).length}</strong> methods</span><span><strong>${(problem.partialResults || []).length}</strong> partial results</span><span><strong>${(problem.failures || []).length}</strong> failures</span><span><strong>${(problem.relations || []).length}</strong> relations</span></div></div>
        </article>
      </div>
      <div class="detail-body">
        <article class="detail-block full"><h4>Tried methods / building blocks</h4><div class="chip-list">${(problem.buildingBlocks || []).map((block)=>`<span class="chip">${escape(block)}</span>`).join('') || '<span class="chip">Not yet mapped</span>'}</div></article>
        <article class="detail-block"><h4>What worked</h4><div class="card-list">${(problem.partialResults || []).map((result)=>`<div class="result-card"><span class="type">Partial result</span><h4>${escape(result.title)}</h4><p>${escape(result.body)}</p>${renderInlineSources(result.sources)}</div>`).join('') || '<span class="hint">No partial result cards yet.</span>'}</div></article>
        <article class="detail-block"><h4>What failed / where it stalled</h4><div class="card-list">${(problem.failures || []).map((failure)=>`<div class="failure-card"><span class="type">${escape(failure.type)}</span><h4>${escape(failure.title)}</h4><p>${escape(failure.body)}</p>${renderInlineSources(failure.sources)}</div>`).join('') || '<span class="hint">No failure cards yet.</span>'}</div></article>
        <article class="detail-block full"><h4>Source trail</h4><div class="card-list">${(problem.sources || []).map((id)=>`<div>${sourceLinks([id])}</div>`).join('') || '<span class="hint">No source trail yet.</span>'}</div></article>
      </div>`;
    detailOverlay.classList.add('open');
    detailOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    typeset(detailPanel);
  }
  function hideDetail() {
    if (!detailOverlay) return;
    detailOverlay.classList.remove('open');
    detailOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function filteredProblems() {
    const q = ((domainSearch && domainSearch.value) || '').toLowerCase();
    const status = (domainStatus && domainStatus.value) || 'all';
    return problems.filter((p)=>{
      const hay = [p.name,p.field,p.oneLine,p.plainStatement,...(p.tags||[]),...(p.buildingBlocks||[])].join(' ').toLowerCase();
      return (status === 'all' || statusClass(p.status) === status) && (!q || hay.includes(q));
    });
  }

  function renderCards() {
    const list = filteredProblems();
    domainCards.innerHTML = list.map((p)=>`<article class="problem-card ${formulaHtml(p) ? '' : 'no-formula'}" data-id="${escape(p.id)}" tabindex="0" role="button" aria-label="Open ${escape(p.name)}"><div><div class="status-row"><span class="status-pill ${statusClass(p.status)}">${escape(displayStatus(p.status))}</span><span class="domain-pill ${domain}">${escape(titleByDomain[domain])}</span></div><h3>${escape(p.name)}</h3>${formulaHtml(p)}<p>${escape(repairUnclosedMath(p.oneLine))}</p></div><div class="card-footer"><span>${escape(p.field)}</span></div></article>`).join('') || '<article class="problem-card"><h3>No cards found</h3><p>Try a different search.</p></article>';
    domainCards.querySelectorAll('.problem-card[data-id]').forEach((card)=>{
      const handler = () => openDetail(problemById.get(card.dataset.id));
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (event)=>{ if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
    });
    typeset(domainCards);
  }

  // Domain timeline and graph are scoped to the active domain only.
  function renderTimeline() {
    const ids = new Set(problems.map((p)=>p.id));
    const events = (timelineEvents || []).filter((e)=>ids.has(e.problemId) || e.domain === domain).sort((a,b)=>(Number(a.year)||9999)-(Number(b.year)||9999)||String(a.title).localeCompare(String(b.title))).slice(0,80);
    domainTimeline.innerHTML = events.map((e)=>`<article class="timeline-item ${escape(e.domain || domain)}"><div class="timeline-year">${e.year || 'undated'}</div><div class="timeline-content"><span class="status-pill ${statusClass(e.status || e.eventType || e.kind)}">${escape(e.eventType || e.kind || e.status || 'event')}</span><h3>${escape(e.title)}</h3><p>${escape(e.summary || e.body || '')}</p><div class="inline-sources">${sourceLinks(e.sourceIds || e.sources || [])}</div></div></article>`).join('') || '<p>No timeline events found.</p>';
  }

  function renderGraph() {
    const width = 1180, height = 680;
    const pnodes = problems.slice(0,140).map((p,i)=>{
      const angle = i * 2.399963229728653; const r = Math.sqrt((i+0.5)/Math.min(problems.length,100));
      return {id:`problem:${p.id}`, problem:p, x:width*0.5+Math.cos(angle)*360*r, y:height*0.54+Math.sin(angle)*240*r};
    });
    const byId = new Map(pnodes.map((n)=>[n.id,n]));
    const methodCounts = new Map();
    (graph.edges||[]).forEach((edge)=>{
      const kind = edge.kind || edge.type;
      if (!['uses_method', 'tried_with', 'method_used_by'].includes(kind)) return;
      const source = graphNodeById.get(edge.source); const target = graphNodeById.get(edge.target);
      if (!source || !target || (source.kind || source.type) !== 'problem' || !byId.has(source.id)) return;
      const arr = methodCounts.get(target.id) || {node:target, count:0}; arr.count += 1; methodCounts.set(target.id, arr);
    });
    const methods = [...methodCounts.values()].sort((a,b)=>b.count-a.count).slice(0,34).map((m,i)=>{
      const angle = i * (Math.PI*2/34); return {id:m.node.id, label:m.node.label || m.node.short || m.node.id.replace(/^method:/,''), x:width*0.5+Math.cos(angle)*500, y:height*0.54+Math.sin(angle)*290};
    });
    methods.forEach((m)=>byId.set(m.id,m));
    const edges = (graph.edges||[]).filter((edge)=>{
      const kind = edge.kind || edge.type;
      return ['uses_method', 'tried_with', 'method_used_by'].includes(kind) && byId.has(edge.source) && byId.has(edge.target);
    }).slice(0,520);
    domainGraph.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Domain graph">${edges.map((e)=>`<line class="graph-edge shared" x1="${byId.get(e.source).x}" y1="${byId.get(e.source).y}" x2="${byId.get(e.target).x}" y2="${byId.get(e.target).y}" />`).join('')}${methods.map((m)=>`<g class="force-node method show-labels" transform="translate(${m.x} ${m.y})"><title>${escape(m.label)}</title><circle r="10"></circle><text y="-14">${escape(truncate(m.label, 24))}</text></g>`).join('')}${pnodes.map((n)=>`<g class="graph-node ${domain}" transform="translate(${n.x} ${n.y})"><title>${escape(n.problem.name)}</title><circle r="6"></circle><text class="node-label" y="-10">${escape(truncate(n.problem.short||n.problem.name, 22))}</text></g>`).join('')}</svg>`;
  }

  if (domainSearch) domainSearch.addEventListener('input', renderCards);
  if (domainStatus) domainStatus.addEventListener('change', renderCards);
  if (closeDetail) closeDetail.addEventListener('click', hideDetail);
  if (detailOverlay) detailOverlay.addEventListener('click', (event)=>{ if (event.target === detailOverlay) hideDetail(); });
  document.addEventListener('keydown', (event)=>{ if (event.key === 'Escape') hideDetail(); });
  renderCards(); renderTimeline(); renderGraph(); typeset(document.body);
})();
