(() => {
  // Legacy compact domain renderer kept for older domain prototypes.
  const data = window.FAILURE_ATLAS_DATA || { problems: [], sources: [] };
  const domain = document.body.dataset.domain || 'math';
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => String(value == null ? '' : value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const normalize = (value) => String(value || '').toLowerCase();
  function inferDomain(problem) {
    const hay = normalize([problem.field, problem.name, ...(problem.tags || []), ...(problem.buildingBlocks || [])].join(' '));
    const physicsKeys = ['physics','cosmology','astronomy','astrophysics','particle','condensed matter','superconduct','dark matter','dark energy','qcd','quantum gravity','black hole','gravit','neutrino','plasma','climate'];
    const csKeys = ['computer science','complexity','algorithm','cryptography','logic','computation','quantum computing','machine learning','formal verification','proof complexity','circuit','approximation','parameterized','streaming','online matching'];
    if (physicsKeys.some((key) => hay.includes(key))) return 'physics';
    if (csKeys.some((key) => hay.includes(key))) return 'cs';
    return 'math';
  }
  function statusClass(status) {
    const value = normalize(status);
    if (value.includes('disproved') || value.includes('false')) return 'disproved';
    if (value.includes('solved') && !value.includes('unsolved') && !value.includes('open')) return 'solved';
    return 'unsolved';
  }
  const labels = { math: 'Mathematics', cs: 'Computer Science', physics: 'Physics' };
  const problems = data.problems.map((p) => ({ ...p, domain: inferDomain(p) })).filter((p) => p.domain === domain).sort((a, b) => a.name.localeCompare(b.name));
  let activeStatus = 'all';
  const search = $('#domainSearch');
  const grid = $('#domainGrid');
  const totalFailures = problems.reduce((sum, p) => sum + (p.failures || []).length, 0);
  const totalPartials = problems.reduce((sum, p) => sum + (p.partialResults || []).length, 0);
  const sourceIds = new Set();
  problems.forEach((p) => (p.sources || []).forEach((id) => sourceIds.add(id)));

  function renderStats() {
    $('#domainTitle').textContent = labels[domain] || 'Domain';
    $('#domainSubtitle').textContent = `${problems.length} cards with ${totalFailures} failure cards and ${totalPartials} partial result cards.`;
    $('#domainProblemCount').textContent = problems.length;
    $('#domainFailureCount').textContent = totalFailures;
    $('#domainPartialCount').textContent = totalPartials;
    $('#domainSourceCount').textContent = sourceIds.size;
  }
  function filtered() {
    const q = normalize(search && search.value);
    return problems.filter((problem) => {
      const okStatus = activeStatus === 'all' || statusClass(problem.status) === activeStatus;
      const hay = normalize([problem.name, problem.field, problem.oneLine, problem.plainStatement, ...(problem.tags || []), ...(problem.buildingBlocks || [])].join(' '));
      return okStatus && (!q || hay.includes(q));
    });
  }
  function renderCards() {
    const list = filtered();
    $('#domainMeta').textContent = `${list.length} shown · ${activeStatus === 'all' ? 'all statuses' : activeStatus}`;
    grid.innerHTML = list.map((problem) => `<article class="problem-card"><div><div class="status-row"><span class="status-pill ${statusClass(problem.status)}">${escape(problem.status)}</span><span class="domain-pill ${domain}">${escape(labels[domain])}</span></div><h3>${escape(problem.name)}</h3><p>${escape(problem.oneLine)}</p></div><div class="chip-list">${(problem.tags || []).slice(0, 4).map((tag) => `<span class="chip">${escape(tag)}</span>`).join('')}</div><div class="card-footer"><span>${escape(problem.field)}</span><a class="button small secondary" href="index.html#${escape(problem.id)}">Open in atlas</a></div></article>`).join('') || '<article class="problem-card"><h3>No cards found</h3><p>Try another search or status filter.</p></article>';
  }
  document.querySelectorAll('.domain-status-filter').forEach((button) => button.addEventListener('click', () => {
    activeStatus = button.dataset.status;
    document.querySelectorAll('.domain-status-filter').forEach((item) => item.classList.toggle('active', item === button));
    renderCards();
  }));
  if (search) search.addEventListener('input', renderCards);
  renderStats();
  renderCards();
})();
