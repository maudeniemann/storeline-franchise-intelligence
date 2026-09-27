const STORELINE_DATA = window.STORELINE_DATA;
const root = document.getElementById('view-root');
const viewLabel = document.getElementById('view-label');
const drawer = document.getElementById('evidence-drawer');
const backdrop = document.getElementById('drawer-backdrop');
const drawerKicker = document.getElementById('drawer-kicker');
const drawerTitle = document.getElementById('drawer-title');
const drawerBody = document.getElementById('drawer-body');
const drawerFooter = document.getElementById('drawer-footer');
const toast = document.getElementById('toast');

const state = {
  view: 'today',
  reviewLocation: 'all',
  pricingLocation: 'all',
  pricingCategory: 'All',
  marketLocation: 'backbay',
  approvals: new Set(),
  agentRunning: false,
  agentComplete: false,
  runtime: null,
  chat: [
    { role: 'assistant', text: 'I retrieve across reviews, modeled sales and market evidence — then turn the grounded answer into an operating playbook.', sources: ['Evidence index', 'Structured sales tools', 'Source-level citations'] },
  ],
};

const labels = { today: 'Today', reviews: 'Reviews', pricing: 'Sales', market: 'Market', next: 'Next steps', assistant: 'Ask Storeline' };
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function sourceUrl(key) { return STORELINE_DATA.sources[key] || '#'; }
function stars(rating) { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character])); }
function safeUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'; } catch { return '#'; } }

function render(view = state.view) {
  state.view = view;
  const template = document.getElementById(`${view}-template`);
  root.replaceChildren(template.content.cloneNode(true));
  viewLabel.textContent = labels[view];
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  if (view === 'today') renderToday();
  if (view === 'reviews') renderReviews();
  if (view === 'pricing') renderPricing();
  if (view === 'market') renderMarket();
  if (view === 'next') renderRecommendations();
  if (view === 'assistant') renderAssistant();
  bindViewEvents();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderToday() {
  const reviewList = document.getElementById('today-review-list');
  reviewList.innerHTML = STORELINE_DATA.reviews.slice(0, 3).map((review) => `
    <button class="today-signal" data-view-jump="reviews"><span class="platform ${review.platform.toLowerCase()}">${review.platform[0]}</span><span><strong>${review.text}</strong><small>${review.author} · ${review.platform} · ${review.date}</small></span><b>→</b></button>`).join('');
  const marketList = document.getElementById('today-market-list');
  marketList.innerHTML = [STORELINE_DATA.trendSignals[0], STORELINE_DATA.macroSignals[0], STORELINE_DATA.macroSignals[2]].map((item, index) => `
    <a class="today-signal" href="${sourceUrl(item.url)}" target="_blank" rel="noreferrer"><span class="change-rank ${['coral-bg','blue-bg','yellow-bg'][index]}">${String(index + 1).padStart(2, '0')}</span><span><strong>${item.title || item.label}</strong><small>${item.stat || item.value} · ${item.source}</small></span><b>↗</b></a>`).join('');
}

function renderReviews() {
  const tabs = document.getElementById('review-location-tabs');
  tabs.innerHTML = STORELINE_DATA.reviewLocations.map((location) => `<button class="filter-chip ${location.id === state.reviewLocation ? 'active' : ''}" data-review-location="${location.id}">${location.name}<span>${location.rating}</span></button>`).join('');
  const selected = STORELINE_DATA.reviewLocations.find((location) => location.id === state.reviewLocation);
  const reviews = state.reviewLocation === 'all' ? STORELINE_DATA.reviews : STORELINE_DATA.reviews.filter((review) => review.location === state.reviewLocation);
  document.getElementById('review-summary').innerHTML = `
    <div><span class="eyebrow">${selected.platform}</span><strong>${selected.rating}</strong><span class="summary-stars">★★★★★</span></div>
    <div><span>Review count</span><strong>${selected.count}</strong></div>
    <div><span>Dominant signal</span><strong>${selected.tone}</strong></div>
    <a href="${sourceUrl(selected.source || 'yelpBoston')}" target="_blank" rel="noreferrer">View source ↗</a>`;
  document.getElementById('review-feed-title').textContent = selected.name;
  document.getElementById('review-feed').innerHTML = reviews.length ? reviews.map((review) => `
    <article class="review-card"><header><span class="platform ${review.platform.toLowerCase()}">${review.platform[0]}</span><div><strong>${review.author}</strong><small>${review.platform} · ${review.date}</small></div><span class="stars">${stars(review.rating)}</span></header><p>“${review.text}”</p><footer>${review.tags.map((tag) => `<span>${tag}</span>`).join('')}</footer></article>`).join('') : `<div class="empty-state"><strong>Profile evidence only</strong><p>Open the source to inspect the location’s current public reviews.</p></div>`;
  document.getElementById('review-clusters').innerHTML = STORELINE_DATA.reviewClusters.map((cluster) => `
    <div class="cluster-item"><div><strong>${cluster.name}</strong><span class="${cluster.direction}">${cluster.direction}</span></div><div class="cluster-track"><i style="width:${(cluster.count / cluster.total) * 100}%"></i></div><p>${cluster.count} of ${cluster.total} supplied reviews · ${cluster.action}</p></div>`).join('');
}

function renderPricing() {
  const locationTabs = document.getElementById('pricing-location-tabs');
  locationTabs.innerHTML = STORELINE_DATA.pricingLocations.map((location) => `<button class="filter-chip ${location.id === state.pricingLocation ? 'active' : ''}" data-pricing-location="${location.id}">${location.name}</button>`).join('');
  const categories = ['All', ...new Set(STORELINE_DATA.products.map((product) => product.category))];
  document.getElementById('pricing-category-tabs').innerHTML = categories.map((category) => `<button class="filter-chip ${category === state.pricingCategory ? 'active' : ''}" data-pricing-category="${category}">${category}</button>`).join('');
  const location = STORELINE_DATA.pricingLocations.find((item) => item.id === state.pricingLocation);
  const filtered = STORELINE_DATA.products.filter((product) => state.pricingCategory === 'All' || product.category === state.pricingCategory);
  const multiplier = location.multiplier;
  const revenue = filtered.reduce((sum, product) => sum + (product.price * product.units * multiplier), 0);
  const units = filtered.reduce((sum, product) => sum + Math.round(product.units * multiplier), 0);
  const margin = Math.round(filtered.reduce((sum, product) => sum + product.margin, 0) / filtered.length);
  const leader = [...filtered].sort((a, b) => b.trend - a.trend)[0];
  document.getElementById('pricing-kpis').innerHTML = `
    <article class="metric-card static"><span>Modeled weekly sales</span><strong>${money.format(revenue).replace('.00','')}</strong><small>${location.name}</small></article>
    <article class="metric-card static"><span>Modeled weekly units</span><strong>${units.toLocaleString()}</strong><small>${state.pricingCategory} products</small></article>
    <article class="metric-card static"><span>Average gross margin</span><strong>${margin}%</strong><small>Curated unit economics</small></article>
    <button class="metric-card" data-open-location="${location.id}"><span>Fastest-growing product</span><strong>${leader.name}</strong><small>+${leader.trend}% · open location detail →</small></button>`;
  document.getElementById('pricing-table-title').textContent = `${location.name} · ${location.note}`;
  document.getElementById('product-table-body').innerHTML = filtered.map((product) => `
    <button class="product-row" data-product="${product.name}"><span><b>${product.name}</b>${product.forecast ? '<em>pilot</em>' : ''}</span><span>${product.category}</span><span>${money.format(product.price)}</span><span>${Math.round(product.units * multiplier).toLocaleString()}</span><span>${product.margin}%</span><span class="positive">+${product.trend}%</span></button>`).join('');
}

function renderMarket() {
  document.getElementById('macro-grid').innerHTML = STORELINE_DATA.macroSignals.map((signal) => `
    <a class="macro-card ${signal.tone}" href="${sourceUrl(signal.url)}" target="_blank" rel="noreferrer"><span>${signal.source} ↗</span><strong>${signal.value}</strong><h3>${signal.label}</h3><p>${signal.detail}</p></a>`).join('');
  document.getElementById('trend-grid').innerHTML = STORELINE_DATA.trendSignals.map((signal, index) => `
    <a class="trend-card" href="${sourceUrl(signal.url)}" target="_blank" rel="noreferrer"><span class="trend-index">0${index + 1}</span><div><h3>${signal.title}</h3><p><strong>${signal.stat}</strong> ${signal.label}</p><small>${signal.source} ↗</small></div></a>`).join('');
  const locationNames = { backbay: 'Back Bay', seaport: 'Pier 4 / Seaport', cambridge: 'Cambridge', southend: 'South End' };
  document.getElementById('market-location-tabs').innerHTML = Object.keys(STORELINE_DATA.competitorGroups).map((key) => `<button class="filter-chip ${key === state.marketLocation ? 'active' : ''}" data-market-location="${key}">${locationNames[key]}</button>`).join('');
  document.getElementById('competitor-grid').innerHTML = STORELINE_DATA.competitorGroups[state.marketLocation].map((item) => `
    <a class="competitor-card" href="${item.maps}" target="_blank" rel="noreferrer"><span class="map-pin">⌖</span><div><strong>${item.name}</strong><span>${item.type}</span><small>${item.address}</small></div><b>↗</b></a>`).join('');
}

function renderRecommendations() {
  document.getElementById('recommendation-list').innerHTML = STORELINE_DATA.recommendations.map((item) => {
    const approved = state.approvals.has(item.id);
    const action = item.id === 'froyo' ? '<button class="primary-button" data-run-playbook>Run playbook</button>' : `<button class="primary-button" data-approve="${item.id}">Approve action</button>`;
    return `<article class="decision-card ${item.id === 'froyo' ? 'featured' : ''} ${approved ? 'approved-card' : ''}"><div class="decision-number">${approved ? '✓' : item.priority}</div><div class="decision-main"><div class="decision-meta"><span class="signal-chip ${approved ? 'approved' : item.id === 'froyo' ? 'opportunity' : item.id === 'beverage' ? 'watch' : 'alert'}">${approved ? 'Approved' : item.type}</span><span>${item.confidence}% confidence</span><span>${item.locations}</span></div><h2>${item.title}</h2><p>${item.why}</p><div class="decision-proof">${item.proof.map((proof, index) => `<span><i class="${['teal','coral','blue'][index] || 'teal'}"></i>${proof}</span>`).join('')}</div></div><div class="decision-actions">${approved ? '<span class="approved-label">Added to the operating plan ✓</span>' : `<button class="secondary-button" data-open-recommendation="${item.id}">Review evidence</button>${action}`}</div></article>`;
  }).join('');
  syncDecisionCounts();
}

function renderAssistant() {
  renderChat();
  if (state.agentComplete) {
    document.querySelectorAll('.workflow-step').forEach((step) => { step.classList.add('complete'); step.querySelector('i').textContent = '✓'; });
    showArtifacts();
  }
  document.getElementById('workflow-status').textContent = state.agentComplete ? 'Package ready' : state.agentRunning ? 'Working' : 'Ready';
  updateRuntimeUI();
}

function renderChat() {
  const thread = document.getElementById('chat-thread');
  if (!thread) return;
  thread.innerHTML = state.chat.map((message) => `<div class="chat-message ${message.role}">${message.role === 'assistant' ? '<span class="assistant-avatar small">S</span>' : ''}<div><p>${escapeHtml(message.text)}</p>${message.citations?.length ? `<footer>${message.citations.map((citation) => citation.source_url ? `<a href="${safeUrl(citation.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(citation.source_name)} · ${escapeHtml(citation.title)} ↗</a>` : `<span>${escapeHtml(citation.source_name)} · ${escapeHtml(citation.title)}</span>`).join('')}</footer>` : message.sources ? `<footer>${message.sources.map((source) => `<span>${escapeHtml(source)}</span>`).join('')}</footer>` : ''}</div></div>`).join('');
  thread.scrollTop = thread.scrollHeight;
}

async function askStoreline(question) {
  const clean = question.trim();
  if (!clean) return;
  state.chat.push({ role: 'user', text: clean });
  renderChat();
  const input = document.getElementById('chat-input');
  const send = document.querySelector('#chat-form button');
  if (input) input.disabled = true;
  if (send) { send.disabled = true; send.textContent = '…'; }
  try {
    const response = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json', 'x-storeline-tenant': 'tatte-boston' }, body: JSON.stringify({ question: clean, location_id: state.reviewLocation === 'all' ? null : state.reviewLocation }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'The evidence service could not answer.');
    const modeLabel = payload.mode === 'llm' ? `${payload.model} · grounded` : payload.mode === 'retrieval_fallback' ? 'Grounded retrieval · model fallback' : 'Grounded retrieval';
    state.chat.push({ role: 'assistant', text: payload.answer, citations: payload.citations, sources: [modeLabel, `${payload.retrieved_count} sources retrieved`] });
  } catch (error) {
    state.chat.push({ role: 'assistant', text: `The evidence service is unavailable: ${error.message}.`, sources: ['Connection status shown above'] });
  } finally {
    if (input) input.disabled = false;
    if (send) { send.disabled = false; send.textContent = '↑'; }
    renderChat();
    input?.focus();
  }
}

async function loadRuntimeStatus() {
  try {
    const response = await fetch('/api/status', { headers: { 'x-storeline-tenant': 'tatte-boston' } });
    if (!response.ok) throw new Error('status unavailable');
    state.runtime = await response.json();
  } catch {
    state.runtime = { retrieval: 'offline', model: 'offline', locations: 0, products: 0, evaluation_cases: 0, evidence: [] };
  }
  updateRuntimeUI();
}

function updateRuntimeUI() {
  const topStatus = document.getElementById('source-health');
  if (topStatus) topStatus.lastChild.textContent = state.runtime?.retrieval === 'online' ? 'Evidence index online' : 'Evidence index offline';
  const badge = document.getElementById('connection-badge');
  const strip = document.getElementById('runtime-strip');
  const line = document.getElementById('assistant-status-line');
  if (!badge || !strip || !line) return;
  if (!state.runtime) return;
  const evidenceCount = (state.runtime.evidence || []).reduce((sum, item) => sum + Number(item.count || 0), 0);
  const modelText = state.runtime.model === 'connected' ? `${state.runtime.model_name} connected` : 'Model key not connected';
  badge.classList.toggle('warning-state', state.runtime.model !== 'connected');
  badge.lastChild.textContent = state.runtime.retrieval === 'online' ? `${evidenceCount} evidence records indexed` : 'Evidence service offline';
  line.textContent = `${modelText} · retrieval ${state.runtime.retrieval}`;
  strip.innerHTML = `<span><b>${evidenceCount}</b> evidence records</span><span><b>${state.runtime.locations}</b> locations</span><span><b>${state.runtime.products}</b> products</span><span><b>${state.runtime.evaluation_cases}</b> evaluation questions</span><span class="${state.runtime.model === 'connected' ? 'runtime-ok' : 'runtime-warn'}">${modelText}</span>`;
}

function runPlaybook() {
  if (state.agentRunning || state.agentComplete) return;
  state.agentRunning = true;
  const status = document.getElementById('workflow-status');
  const button = document.getElementById('run-playbook');
  if (status) status.textContent = 'Working';
  if (button) { button.disabled = true; button.textContent = 'Building launch package…'; }
  const steps = [...document.querySelectorAll('.workflow-step')];
  steps.forEach((step, index) => setTimeout(() => {
    step.classList.add('complete');
    step.querySelector('i').textContent = '✓';
    if (index === steps.length - 1) {
      state.agentRunning = false;
      state.agentComplete = true;
      state.approvals.add('froyo');
      syncDecisionCounts();
      status.textContent = 'Package ready';
      button.hidden = true;
      showArtifacts();
      state.chat.push({ role: 'assistant', text: 'The Greek froyo launch package is ready: market brief, $7.50 offer, campaign copy, manager checklist and 14-day scorecard.', sources: ['4 artifacts created', '2 pilot locations', '14-day test'] });
      renderChat();
    }
  }, 550 * (index + 1)));
}

function showArtifacts() {
  const stack = document.getElementById('artifact-stack');
  const button = document.getElementById('run-playbook');
  if (!stack) return;
  stack.hidden = false;
  stack.innerHTML = '<span class="eyebrow">Launch package</span><button data-artifact="Market brief"><b>Market brief</b><small>5 competitors · 3 source links</small><i>View →</i></button><button data-artifact="Campaign kit"><b>Campaign kit</b><small>Email · social · counter card</small><i>View →</i></button><button data-artifact="Store checklist"><b>Store checklist</b><small>Prep · staffing · launch sequence</small><i>View →</i></button><button data-artifact="Pilot scorecard"><b>Pilot scorecard</b><small>Attach rate · repeat · margin</small><i>View →</i></button>';
  if (button) button.hidden = true;
  stack.querySelectorAll('[data-artifact]').forEach((item) => item.addEventListener('click', () => showToast(`${item.dataset.artifact} opened in the launch workspace.`)));
}

function recommendationDrawer(id) {
  const item = STORELINE_DATA.recommendations.find((rec) => rec.id === id);
  drawerKicker.textContent = 'Decision evidence';
  drawerTitle.textContent = item.title;
  const context = id === 'froyo' ? `
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark teal">01</span><div><h3>Modeled product economics</h3><p>Curated pricing scenario</p></div></div><div class="evidence-metrics"><div><strong>$7.50</strong><span>Target price</span></div><div><strong>68%</strong><span>Gross margin</span></div><div><strong>224</strong><span>Weekly units</span></div></div><p class="evidence-note">Use the price as the test anchor. Measure attach rate and repeat purchases before adding it to the permanent menu.</p></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark coral">02</span><div><h3>Customer language</h3><p>Supplied Yelp review corpus</p></div></div><div class="review-quote"><span class="platform yelp">Y</span><p>“Fresh and quality ingredients everywhere.”</p><b>5★</b></div><div class="review-quote"><span class="platform yelp">Y</span><p>“The black sesame latte was unique.”</p><b>5★</b></div><p class="evidence-note">Reviews support premium ingredients and distinctive drinks; they do not by themselves prove frozen-yogurt demand.</p></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark blue">03</span><div><h3>Market context</h3><p>Current public reporting</p></div></div><div class="market-list"><a href="${sourceUrl('froyoTrend')}" target="_blank" rel="noreferrer"><span>#froyo social activity</span><strong>+16% ↗</strong></a><a href="${sourceUrl('froyoRestaurants')}" target="_blank" rel="noreferrer"><span>Greek froyo launch reel</span><strong>20.5k views ↗</strong></a><a href="${sourceUrl('tatteMenu')}" target="_blank" rel="noreferrer"><span>Existing Greek-yogurt menu anchors</span><strong>2 items ↗</strong></a></div></section>` : `
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark coral">01</span><div><h3>Why this surfaced</h3><p>Connected operating evidence</p></div></div><p class="drawer-copy">${item.why}</p></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark teal">02</span><div><h3>Signals to measure</h3><p>Decision proof</p></div></div><div class="proof-grid">${item.proof.map((proof) => `<span>${proof}</span>`).join('')}</div></section>`;
  drawerBody.innerHTML = `<div class="recommendation-brief"><span class="signal-chip opportunity">${item.type}</span><p>${item.title}</p><div class="confidence-row"><span>Confidence</span><strong>${item.confidence}%</strong><div><i style="width:${item.confidence}%"></i></div></div></div>${context}<section class="measurement-plan"><span class="eyebrow">Measurement plan</span><div class="plan-grid"><div><b>1</b><span>Baseline</span><strong>7 days</strong></div><div><b>2</b><span>Test</span><strong>14 days</strong></div><div><b>3</b><span>Decide</span><strong>Keep / change</strong></div></div></section>`;
  drawerFooter.innerHTML = `<button class="secondary-button close-drawer">Close</button>${id === 'froyo' ? '<button class="primary-button" data-run-playbook>Run playbook</button>' : state.approvals.has(id) ? '<span class="approved-label">Approved ✓</span>' : `<button class="primary-button" data-drawer-approve="${id}">Approve action</button>`}`;
  openDrawer();
}

function locationDrawer(id) {
  const location = STORELINE_DATA.pricingLocations.find((item) => item.id === id) || STORELINE_DATA.pricingLocations[0];
  const reviewLocation = STORELINE_DATA.reviewLocations.find((item) => item.id === id || (id === 'seaport' && item.id === 'pier4'));
  const reviews = STORELINE_DATA.reviews.filter((review) => review.location === (id === 'seaport' ? 'pier4' : id)).slice(0, 3);
  const leaders = [...STORELINE_DATA.products].sort((a, b) => (b.units * b.price) - (a.units * a.price)).slice(0, 5);
  drawerKicker.textContent = 'Location profile';
  drawerTitle.textContent = location.name;
  drawerBody.innerHTML = `<div class="recommendation-brief"><span class="signal-chip opportunity">Product mix</span><p>${location.note}. Select this location in Sales to see adjusted units and revenue.</p></div><section class="evidence-section"><div class="evidence-heading"><span class="source-mark coral">01</span><div><h3>Public review profile</h3><p>${reviewLocation ? reviewLocation.platform : 'Public sources'}</p></div></div><div class="evidence-metrics"><div><strong>${reviewLocation?.rating || '—'}</strong><span>Rating</span></div><div><strong>${reviewLocation?.count || '—'}</strong><span>Reviews</span></div><div><strong>${reviewLocation?.tone || 'Cross-location'}</strong><span>Main signal</span></div></div>${reviews.map((review) => `<div class="review-quote"><span class="platform ${review.platform.toLowerCase()}">${review.platform[0]}</span><p>“${review.text}”</p><b>${review.rating}★</b></div>`).join('')}</section><section class="evidence-section"><div class="evidence-heading"><span class="source-mark teal">02</span><div><h3>Top modeled products</h3><p>Revenue-ranked</p></div></div><div class="market-list">${leaders.map((product) => `<div><span>${product.name}</span><strong>${money.format(product.price * product.units * location.multiplier).replace('.00','')}</strong></div>`).join('')}</div></section>`;
  drawerFooter.innerHTML = '<button class="secondary-button close-drawer">Close</button>';
  openDrawer();
}

function bindViewEvents() {
  document.querySelectorAll('[data-view-jump]').forEach((button) => button.addEventListener('click', () => render(button.dataset.viewJump)));
  document.querySelectorAll('[data-open-recommendation]').forEach((button) => button.addEventListener('click', () => recommendationDrawer(button.dataset.openRecommendation)));
  document.querySelectorAll('[data-open-location]').forEach((button) => button.addEventListener('click', () => locationDrawer(button.dataset.openLocation)));
  document.querySelectorAll('[data-review-location]').forEach((button) => button.addEventListener('click', () => { state.reviewLocation = button.dataset.reviewLocation; renderReviews(); bindViewEvents(); }));
  document.querySelectorAll('[data-pricing-location]').forEach((button) => button.addEventListener('click', () => { state.pricingLocation = button.dataset.pricingLocation; renderPricing(); bindViewEvents(); }));
  document.querySelectorAll('[data-pricing-category]').forEach((button) => button.addEventListener('click', () => { state.pricingCategory = button.dataset.pricingCategory; renderPricing(); bindViewEvents(); }));
  document.querySelectorAll('[data-market-location]').forEach((button) => button.addEventListener('click', () => { state.marketLocation = button.dataset.marketLocation; renderMarket(); bindViewEvents(); }));
  document.querySelectorAll('[data-approve]').forEach((button) => button.addEventListener('click', () => approve(button.dataset.approve)));
  document.querySelectorAll('[data-run-playbook]').forEach((button) => button.addEventListener('click', () => { closeDrawer(); render('assistant'); setTimeout(runPlaybook, 180); }));
  document.querySelectorAll('[data-product]').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.product} · product economics selected`)));
  document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => askStoreline(button.dataset.prompt)));
  const chatForm = document.getElementById('chat-form');
  if (chatForm) chatForm.addEventListener('submit', (event) => { event.preventDefault(); const input = document.getElementById('chat-input'); askStoreline(input.value); input.value = ''; });
  const clearChat = document.getElementById('clear-chat');
  if (clearChat) clearChat.addEventListener('click', () => { state.chat = state.chat.slice(0, 1); renderChat(); });
  const runButton = document.getElementById('run-playbook');
  if (runButton) runButton.addEventListener('click', runPlaybook);
}

function approve(id) {
  state.approvals.add(id);
  syncDecisionCounts();
  showToast('Action approved and added to the operating plan.');
  if (state.view === 'next') renderRecommendations();
  if (drawer.classList.contains('open')) closeDrawer();
}

function syncDecisionCounts() {
  const remaining = STORELINE_DATA.recommendations.length - state.approvals.size;
  document.getElementById('decision-count').textContent = remaining;
  const open = document.getElementById('open-decision-count');
  const approved = document.getElementById('approved-decision-count');
  if (open) open.textContent = remaining;
  if (approved) approved.textContent = state.approvals.size;
}

function openDrawer() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add('visible'));
  drawer.querySelectorAll('.close-drawer').forEach((button) => button.addEventListener('click', closeDrawer));
  drawer.querySelectorAll('[data-drawer-approve]').forEach((button) => button.addEventListener('click', () => approve(button.dataset.drawerApprove)));
  drawer.querySelectorAll('[data-run-playbook]').forEach((button) => button.addEventListener('click', () => { closeDrawer(); render('assistant'); setTimeout(runPlaybook, 180); }));
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('visible');
  setTimeout(() => { backdrop.hidden = true; }, 220);
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => render(button.dataset.view)));
document.querySelectorAll('.close-drawer').forEach((button) => button.addEventListener('click', closeDrawer));
backdrop.addEventListener('click', closeDrawer);
document.getElementById('help-button').addEventListener('click', () => showToast('Storeline retrieves reviews, modeled sales and market evidence with source-level citations.'));
document.getElementById('account-button').addEventListener('click', () => showToast('Tatte Bakery & Café · Boston intelligence layer'));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

render('today');
loadRuntimeStatus();
