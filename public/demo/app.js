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
  nextLocation: 'all',
  nextType: 'all',
  approvals: new Set(),
  agentRunning: false,
  agentComplete: false,
  marketingRevision: 0,
  marketingStatus: 'draft',
  runtime: null,
  chat: [
    { role: 'assistant', text: 'I retrieve across reviews, modeled sales and market evidence — then turn the grounded answer into an operating playbook.', sources: ['Evidence index', 'Structured sales tools', 'Source-level citations'] },
  ],
};

const labels = { today: 'Today', reviews: 'Reviews', pricing: 'Sales', market: 'Market', next: 'Next steps', workspace: 'Workspace', assistant: 'Ask Storeline' };
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const marketingVariants = [
  { angle: 'A lighter afternoon ritual', caption: 'A lighter afternoon ritual: thick Greek froyo, pistachio and honey—made for the iced-coffee hour.', schedule: 'Monday · 1:35 PM ET' },
  { angle: 'Your iced coffee found its match', caption: 'Your iced coffee found its match. Greek froyo with pistachio and honey lands after 2 PM at Back Bay and Pier 4.', schedule: 'Tuesday · 2:05 PM ET' },
  { angle: 'Fourteen days. Two cafés. One cool new ritual.', caption: 'Fourteen days. Two cafés. One cool new ritual. Try our Greek froyo pilot at Back Bay and Pier 4 while it lasts.', schedule: 'Thursday · 1:45 PM ET' },
];

function sourceUrl(key) { return STORELINE_DATA.sources[key] || '#'; }
function stars(rating) { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character])); }
function safeUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'; } catch { return '#'; } }

function synthesisPanel({ label, title, summary, signals, action, sources }) {
  return `<div class="synthesis-head"><span class="synthesis-mark">✦</span><div><span class="eyebrow">${escapeHtml(label)}</span><h2>${escapeHtml(title)}</h2></div><span class="synthesis-grounding">Reviews + Sales + Market</span></div>
    <p class="synthesis-summary">${escapeHtml(summary)}</p>
    <div class="synthesis-grid">${signals.map((signal) => `<article class="tone-${signal.tone || 'teal'}"><span>${escapeHtml(signal.label)}</span><strong>${escapeHtml(signal.title)}</strong><p>${escapeHtml(signal.text)}</p></article>`).join('')}</div>
    <div class="synthesis-action"><span>Recommended move</span><strong>${escapeHtml(action)}</strong></div>
    <footer>${sources.map((source) => `<a href="${safeUrl(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)} ↗</a>`).join('')}</footer>`;
}

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
  if (view === 'workspace') renderWorkspace();
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
    <div class="summary-actions"><a href="${sourceUrl(selected.source || 'yelpBoston')}" target="_blank" rel="noreferrer">View source ↗</a>${selected.id === 'backbay' ? '<button data-open-location="backbay">View strengths & gaps →</button>' : ''}</div>`;
  document.getElementById('review-feed-title').textContent = selected.name;
  const reviewSummary = state.reviewLocation === 'all'
    ? 'Product and pastry quality are the strongest brand assets. The preventable losses are beverage inconsistency, peak seating friction and morning availability — all concentrated in categories with strong modeled sales economics.'
    : `${selected.name} is currently defined by ${selected.tone.toLowerCase()}. The local comments matter most when read beside the chain-wide beverage economics and Boston value pressure.`;
  document.getElementById('review-synthesis').innerHTML = synthesisPanel({
    label: 'AI review synthesis',
    title: state.reviewLocation === 'all' ? 'Love the product. Remove the operating friction.' : `${selected.name}: turn comments into operating priorities.`,
    summary: reviewSummary,
    signals: [
      { label: 'Review pattern', title: 'Quality creates the pull', text: 'Pastries, coffee and distinctive flavors drive the clearest positive language.', tone: 'coral' },
      { label: 'Sales connection', title: 'Protect high-margin drinks', text: 'Cold Brew and specialty lattes combine strong modeled growth with 74–81% margins.', tone: 'teal' },
      { label: 'Market connection', title: 'Reliability beats more discounting', text: 'With 42% of consumers cutting café spend, consistency and availability must justify the premium.', tone: 'blue' },
    ],
    action: 'Calibrate matcha and cold brew twice daily, increase morning latte prep, and test portable afternoon froyo away from the seating peak.',
    sources: [
      { label: 'Public reviews', url: sourceUrl(selected.source || 'yelpBoston') },
      { label: 'Restaurant affordability', url: sourceUrl('restaurantDemand') },
      { label: 'Sales model', url: sourceUrl('tatteMenu') },
    ],
  });
  document.getElementById('review-feed').innerHTML = reviews.length ? reviews.map((review) => `
    <article class="review-card"><header><span class="platform ${review.platform.toLowerCase()}">${review.platform[0]}</span><div><strong>${review.author}</strong><small>${review.platform} · ${review.date}</small></div><span class="stars">${stars(review.rating)}</span></header><p>“${review.text}”</p><footer>${review.tags.map((tag) => `<span>${tag}</span>`).join('')}</footer></article>`).join('') : `<div class="empty-state"><strong>Profile evidence only</strong><p>Open the source to inspect the location’s current public reviews.</p></div>`;
  document.getElementById('review-clusters').innerHTML = STORELINE_DATA.reviewClusters.map((cluster) => `
    <div class="cluster-item"><div><strong>${cluster.name}</strong><span class="${cluster.direction}">${cluster.direction}</span></div><div class="cluster-track"><i style="width:${(cluster.count / cluster.total) * 100}%"></i></div><p>${cluster.count} of ${cluster.total} supplied reviews · ${cluster.action}</p></div>`).join('');
}

function renderSalesInsights(products, multiplier) {
  const categoryTotals = Object.values(products.reduce((groups, product) => {
    const revenue = product.price * product.units * multiplier;
    groups[product.category] ||= { name: product.category, revenue: 0 };
    groups[product.category].revenue += revenue;
    return groups;
  }, {})).sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = categoryTotals.reduce((sum, category) => sum + category.revenue, 0);
  const categoryPeak = Math.max(...categoryTotals.map((category) => category.revenue), 1);
  const categoryClass = (name) => `category-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  document.getElementById('sales-category-chart').innerHTML = categoryTotals.map((category) => `
    <div class="sales-bar-row"><div class="sales-bar-label"><span>${escapeHtml(category.name)}</span><b>${money.format(category.revenue).replace('.00', '')}</b></div><div class="sales-bar-track"><i class="${categoryClass(category.name)}" style="width:${Math.max(8, (category.revenue / categoryPeak) * 100)}%"></i></div></div>`).join('');
  const categoryLeader = categoryTotals[0];
  document.getElementById('sales-category-takeaway').innerHTML = `<b>${escapeHtml(categoryLeader.name)} leads</b> with ${Math.round((categoryLeader.revenue / totalRevenue) * 100)}% of selected weekly sales.`;

  const velocity = [...products].sort((a, b) => b.units - a.units).slice(0, 5);
  const velocityPeak = Math.max(...velocity.map((product) => product.units * multiplier), 1);
  document.getElementById('sales-velocity-chart').innerHTML = velocity.map((product) => {
    const adjustedUnits = Math.round(product.units * multiplier);
    return `<div class="sales-bar-row"><div class="sales-bar-label"><span title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</span><b>${adjustedUnits.toLocaleString()}</b></div><div class="sales-bar-track"><i class="velocity-bar" style="width:${Math.max(8, (adjustedUnits / velocityPeak) * 100)}%"></i></div></div>`;
  }).join('');
  const velocityLeader = velocity[0];
  document.getElementById('sales-velocity-takeaway').innerHTML = `<b>${escapeHtml(velocityLeader.name)} sets the pace</b> at ${Math.round(velocityLeader.units * multiplier).toLocaleString()} weekly units and ${velocityLeader.margin}% margin.`;

  const opportunities = [...products].sort((a, b) => b.trend - a.trend).slice(0, 5);
  const minMargin = Math.min(...opportunities.map((product) => product.margin)) - 2;
  const maxMargin = Math.max(...opportunities.map((product) => product.margin)) + 2;
  const marginRange = Math.max(1, maxMargin - minMargin);
  const maxTrend = Math.max(...opportunities.map((product) => product.trend), 1);
  const opportunityScore = (product) => (product.trend / maxTrend) * .58 + (product.margin / 100) * .42;
  const opportunityLeader = [...opportunities].sort((a, b) => opportunityScore(b) - opportunityScore(a))[0];
  const opportunityLabel = (name) => ({
    'Greek Frozen Yogurt Pilot': 'Froyo pilot',
    'Black Sesame Latte': 'Black Sesame',
    'Pistachio Latte': 'Pist. Latte',
    'Pistachio Tart': 'Pistachio Tart',
  }[name] || name);
  document.getElementById('sales-opportunity-chart').innerHTML = `
    <div class="opportunity-y-label"><span>${maxMargin}%</span><span>${Math.round((minMargin + maxMargin) / 2)}%</span><span>${minMargin}%</span></div>
    <div class="opportunity-plot"><i class="plot-grid horizontal one"></i><i class="plot-grid horizontal two"></i><i class="plot-grid vertical one"></i><i class="plot-grid vertical two"></i>${opportunities.map((product, index) => {
      const left = 7 + (product.trend / maxTrend) * 84;
      const bottom = 9 + ((product.margin - minMargin) / marginRange) * 78;
      const isLeader = product.name === opportunityLeader.name;
      return `<span class="opportunity-point point-${index} ${isLeader ? 'leader' : ''}" style="left:${left}%;bottom:${bottom}%" title="${escapeHtml(product.name)}: +${product.trend}% growth, ${product.margin}% margin"><i></i><b>${escapeHtml(opportunityLabel(product.name))}</b></span>`;
    }).join('')}<div class="opportunity-x-label"><span>Lower growth</span><span>Higher growth →</span></div></div>`;
  document.getElementById('sales-opportunity-takeaway').innerHTML = `<b>${escapeHtml(opportunityLeader.name)} is the clearest test</b> at +${opportunityLeader.trend}% growth and ${opportunityLeader.margin}% modeled margin.`;
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
  const revenueLeader = [...filtered].sort((a, b) => (b.price * b.units) - (a.price * a.units))[0];
  renderSalesInsights(filtered, multiplier);
  document.getElementById('pricing-kpis').innerHTML = `
    <article class="metric-card static"><span>Modeled weekly sales</span><strong>${money.format(revenue).replace('.00','')}</strong><small>${location.name}</small></article>
    <article class="metric-card static"><span>Modeled weekly units</span><strong>${units.toLocaleString()}</strong><small>${state.pricingCategory} products</small></article>
    <article class="metric-card static"><span>Average gross margin</span><strong>${margin}%</strong><small>Curated unit economics</small></article>
    <button class="metric-card" data-open-location="${location.id}"><span>Fastest-growing product</span><strong>${leader.name}</strong><small>+${leader.trend}% · open location detail →</small></button>`;
  document.getElementById('pricing-table-title').textContent = `${location.name} · ${location.note}`;
  document.getElementById('sales-synthesis').innerHTML = synthesisPanel({
    label: 'AI sales synthesis',
    title: `${location.name}: sales strength is concentrated in repeatable beverage occasions.`,
    summary: `${revenueLeader.name} leads the selected modeled mix by weekly revenue, while ${leader.name} has the strongest growth signal. The pattern supports protecting core availability before adding a tightly measured afternoon offer.`,
    signals: [
      { label: 'Sales pattern', title: `${money.format(revenue).replace('.00','')} modeled weekly sales`, text: `${units.toLocaleString()} units at a ${margin}% average modeled gross margin for the current filters.`, tone: 'teal' },
      { label: 'Review connection', title: 'Distinctive drinks win — consistency leaks value', text: 'Guests praise unique latte flavors but flag milky matcha, inconsistent cold brew and morning sellouts.', tone: 'coral' },
      { label: 'Market connection', title: 'Grow without losing the value ladder', text: 'Boston dining inflation is 5.1% while 42% of consumers report spending less at cafés and takeout.', tone: 'blue' },
    ],
    action: `Protect ${revenueLeader.name} availability, retain an entry-price drink, and measure the $7.50 froyo pilot on attach rate and repeat purchase.`,
    sources: [
      { label: 'Official Tatte menu photography', url: 'https://tattebakery.com/menu#full-menu' },
      { label: 'Boston inflation', url: sourceUrl('blsBoston') },
      { label: 'Public reviews', url: sourceUrl('yelpBoston') },
    ],
  });
  document.getElementById('product-table-body').innerHTML = filtered.map((product) => `
    <button class="product-row" data-product="${product.name}"><span class="product-identity">${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)} from the Tatte menu" loading="lazy">` : '<i class="pilot-image">PILOT</i>'}<span><b>${product.name}</b>${product.forecast ? '<em>concept</em>' : ''}<small>${escapeHtml(product.imageNote)}</small></span></span><span>${product.category}</span><span>${money.format(product.price)}</span><span>${Math.round(product.units * multiplier).toLocaleString()}</span><span>${product.margin}%</span><span class="positive">+${product.trend}%</span></button>`).join('');
}

function renderMarket() {
  document.getElementById('macro-grid').innerHTML = STORELINE_DATA.macroSignals.map((signal) => `
    <a class="macro-card ${signal.tone}" href="${sourceUrl(signal.url)}" target="_blank" rel="noreferrer"><span>${signal.source} ↗</span><strong>${signal.value}</strong><h3>${signal.label}</h3><p>${signal.detail}</p></a>`).join('');
  document.getElementById('market-synthesis').innerHTML = synthesisPanel({
    label: 'AI market synthesis',
    title: 'Selective growth is possible, but the offer has to earn its premium.',
    summary: 'Frozen yogurt is regaining attention while restaurant costs and consumer affordability pressure remain elevated. Storeline connects that outside demand to the internal beverage mix and review language, making a narrow pilot stronger than a broad menu launch.',
    signals: [
      { label: 'Market pattern', title: 'Momentum plus pressure', text: '#froyo activity rose 16%, but Boston dining prices are up 5.1% and restaurant expenses are up 36% since 2019.', tone: 'blue' },
      { label: 'Sales connection', title: 'Attach to cold-drink demand', text: 'Cold Brew carries the strongest existing modeled beverage growth at 24% with an 81% margin.', tone: 'teal' },
      { label: 'Review connection', title: 'Portable and lighter fits the gap', text: 'Guest language points to lighter choices and lunchtime seating friction — both favor a take-away afternoon test.', tone: 'coral' },
    ],
    action: 'Run a 14-day Pier 4 and Back Bay pilot, keep the price at $7.50, and stop or expand based on attach rate, repeat purchase and margin.',
    sources: [
      { label: 'Axios froyo trend', url: sourceUrl('froyoTrend') },
      { label: 'BLS Boston prices', url: sourceUrl('blsBoston') },
      { label: 'WBEZ Greek froyo demand', url: sourceUrl('froyoRestaurants') },
    ],
  });
  document.getElementById('trend-grid').innerHTML = STORELINE_DATA.trendSignals.map((signal, index) => `
    <a class="trend-card" href="${sourceUrl(signal.url)}" target="_blank" rel="noreferrer"><span class="trend-index">0${index + 1}</span><div><h3>${signal.title}</h3><p><strong>${signal.stat}</strong> ${signal.label}</p><small>${signal.source} ↗</small></div></a>`).join('');
  const locationNames = { backbay: 'Back Bay', seaport: 'Pier 4 / Seaport', cambridge: 'Cambridge', southend: 'South End' };
  document.getElementById('market-location-tabs').innerHTML = Object.keys(STORELINE_DATA.competitorGroups).map((key) => `<button class="filter-chip ${key === state.marketLocation ? 'active' : ''}" data-market-location="${key}">${locationNames[key]}</button>`).join('');
  document.getElementById('competitor-grid').innerHTML = STORELINE_DATA.competitorGroups[state.marketLocation].map((item) => `
    <a class="competitor-card" href="${item.maps}" target="_blank" rel="noreferrer"><span class="map-pin">⌖</span><div><strong>${item.name}</strong><span>${item.type}</span><small>${item.address}</small></div><b>↗</b></a>`).join('');
}

function renderRecommendations() {
  const locationFilter = document.getElementById('decision-location-filter');
  const typeFilter = document.getElementById('decision-type-filter');
  if (locationFilter) locationFilter.value = state.nextLocation;
  if (typeFilter) typeFilter.value = state.nextType;
  const filtered = STORELINE_DATA.recommendations.filter((item) => (state.nextLocation === 'all' || item.locationKeys.includes(state.nextLocation)) && (state.nextType === 'all' || item.type === state.nextType));
  document.getElementById('recommendation-list').innerHTML = filtered.length ? filtered.map((item) => {
    const approved = state.approvals.has(item.id);
    const action = item.id === 'froyo' ? '<button class="primary-button" data-run-playbook>Run playbook</button>' : `<button class="primary-button" data-approve="${item.id}">Approve action</button>`;
    return `<article class="decision-card ${item.id === 'froyo' ? 'featured' : ''} ${approved ? 'approved-card' : ''}"><div class="decision-number">${approved ? '✓' : item.priority}</div><div class="decision-main"><div class="decision-meta"><span class="signal-chip ${approved ? 'approved' : item.id === 'froyo' ? 'opportunity' : item.id === 'beverage' ? 'watch' : 'alert'}">${approved ? 'Approved' : item.type}</span><span>${item.confidence}% confidence</span><span>${item.locations}</span></div><h2>${item.title}</h2><p>${item.why}</p><div class="decision-proof">${item.proof.map((proof, index) => `<span><i class="${['teal','coral','blue'][index] || 'teal'}"></i>${proof}</span>`).join('')}</div></div><div class="decision-side"><div class="impact-estimate"><span>Estimated impact</span><strong>${item.impact}</strong><small>${item.impactLabel}</small></div><div class="decision-actions">${approved ? '<span class="approved-label">Added to the operating plan ✓</span>' : `<button class="secondary-button" data-open-recommendation="${item.id}">View action</button>${action}`}</div></div></article>`;
  }).join('') : '<div class="empty-state"><strong>No actions match these filters</strong><p>Clear a filter to restore the full priority list.</p></div>';
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

function renderWorkspace() {
  const variant = marketingVariants[state.marketingRevision % marketingVariants.length];
  const caption = document.getElementById('instagram-caption');
  const angle = document.getElementById('marketing-angle');
  const schedule = document.getElementById('marketing-schedule');
  const status = document.getElementById('marketing-status');
  const approve = document.getElementById('approve-marketing');
  const note = document.getElementById('marketing-approval-note');
  const kpi = document.getElementById('workspace-approval-kpi');
  if (caption) caption.textContent = variant.caption;
  if (angle) angle.textContent = variant.angle;
  if (schedule) schedule.textContent = variant.schedule;
  if (state.marketingStatus === 'scheduled') {
    status.textContent = 'Scheduled';
    status.classList.add('scheduled');
    approve.textContent = 'Scheduled ✓';
    approve.disabled = true;
    note.textContent = `Approved by owner · queued for ${variant.schedule} in the marketing workflow.`;
    kpi.textContent = '0 open';
  }
}

function focusWorkspaceArtifact(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.remove('workspace-focus');
  requestAnimationFrame(() => {
    target.classList.add('workspace-focus');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function renderChat() {
  const thread = document.getElementById('chat-thread');
  if (!thread) return;
  thread.innerHTML = state.chat.map((message) => `<div class="chat-message ${message.role}">${message.role === 'assistant' ? '<span class="assistant-avatar small">S</span>' : ''}<div><p>${escapeHtml(message.text)}</p>${message.citations?.length ? `<footer>${message.citations.map((citation) => citation.source_url ? `<a href="${safeUrl(citation.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(citation.source_name)} · ${escapeHtml(citation.title)} ↗</a>` : `<span>${escapeHtml(citation.source_name)} · ${escapeHtml(citation.title)}</span>`).join('')}</footer>` : message.sources ? `<footer>${message.sources.map((source) => `<span>${escapeHtml(source)}</span>`).join('')}</footer>` : ''}</div></div>`).join('');
  thread.scrollTop = thread.scrollHeight;
}

function bundledAnswer(question) {
  const prompt = question.toLowerCase();
  if (prompt.includes('froyo') || prompt.includes('frozen yogurt')) return 'The strongest case is a 14-day Back Bay and Pier 4 pilot at $7.50. Market reporting shows destination demand for Greek froyo, modeled margin is 68%, and the existing cold-drink occasion creates a natural afternoon attachment point. Track attach rate, repeat purchase, margin and stockouts before expanding.';
  if (prompt.includes('location') || prompt.includes('where')) return 'Pier 4 is the cleaner first test because it has the strongest cold-drink and portable-dessert fit. Back Bay should run in parallel at lower volume so the team can measure whether the offer offsets afternoon demand without adding to the morning queue.';
  if (prompt.includes('sales') || prompt.includes('price') || prompt.includes('risk')) return 'Protect the value ladder: keep an entry-price drink, hold the froyo pilot at $7.50, and do not expand unless the 68% modeled margin survives labor and waste. The main operating risks are stockouts, beverage inconsistency and trading customers out of core high-margin drinks.';
  return 'Across the bundled review, sales and market evidence, product quality creates demand while availability and consistency leak value. The next move is to protect core beverage execution, then test one measurable afternoon offer rather than expanding the menu broadly.';
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
  } catch {
    state.chat.push({ role: 'assistant', text: bundledAnswer(clean), sources: ['Bundled review evidence', 'Modeled sales', 'Current market sources'] });
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
    state.runtime = { retrieval: 'bundled', model: 'preview', model_name: 'Grounded preview', locations: 10, products: 15, evaluation_cases: 5, evidence: [{ source_type: 'bundled', count: 21 }] };
  }
  updateRuntimeUI();
}

function updateRuntimeUI() {
  const topStatus = document.getElementById('source-health');
  const retrievalReady = ['online', 'bundled'].includes(state.runtime?.retrieval);
  if (topStatus) topStatus.lastChild.textContent = state.runtime?.retrieval === 'online' ? 'Evidence index online' : state.runtime?.retrieval === 'bundled' ? 'Sources loaded' : 'Evidence unavailable';
  const badge = document.getElementById('connection-badge');
  const strip = document.getElementById('runtime-strip');
  const line = document.getElementById('assistant-status-line');
  if (!badge || !strip || !line) return;
  if (!state.runtime) return;
  const evidenceCount = (state.runtime.evidence || []).reduce((sum, item) => sum + Number(item.count || 0), 0);
  const modelText = state.runtime.model === 'connected' ? `${state.runtime.model_name} connected` : state.runtime.model === 'preview' ? 'Grounded preview' : 'Model key not connected';
  badge.classList.toggle('warning-state', !retrievalReady);
  badge.lastChild.textContent = retrievalReady ? `${evidenceCount} evidence records loaded` : 'Evidence unavailable';
  line.textContent = `${modelText} · ${state.runtime.retrieval === 'bundled' ? 'bundled evidence' : `retrieval ${state.runtime.retrieval}`}`;
  strip.innerHTML = `<span><b>${evidenceCount}</b> evidence records</span><span><b>${state.runtime.locations}</b> locations</span><span><b>${state.runtime.products}</b> products</span><span><b>${state.runtime.evaluation_cases}</b> evaluation questions</span><span class="${retrievalReady ? 'runtime-ok' : 'runtime-warn'}">${modelText}</span>`;
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
  stack.innerHTML = '<span class="eyebrow">Launch package</span><button data-open-workspace="market-brief"><b>Market brief</b><small>5 competitors · 3 source links</small><i>View →</i></button><button data-open-workspace="campaign-kit"><b>Campaign kit</b><small>Instagram · story · caption</small><i>View →</i></button><button data-open-workspace="store-checklist"><b>Store checklist</b><small>Prep · staffing · launch sequence</small><i>View →</i></button><button data-open-workspace="pilot-scorecard"><b>Pilot scorecard</b><small>Attach rate · repeat · margin</small><i>View →</i></button>';
  if (button) button.hidden = true;
  stack.querySelectorAll('[data-open-workspace]').forEach((item) => item.addEventListener('click', () => {
    const artifact = item.dataset.openWorkspace;
    render('workspace');
    setTimeout(() => focusWorkspaceArtifact(artifact), 120);
  }));
}

function recommendationDrawer(id) {
  const item = STORELINE_DATA.recommendations.find((rec) => rec.id === id);
  drawerKicker.textContent = 'Decision evidence';
  drawerTitle.textContent = item.title;
  const context = id === 'froyo' ? `
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark teal">01</span><div><h3>Modeled product economics</h3><p>Curated pricing scenario</p></div></div><div class="evidence-metrics"><div><strong>$7.50</strong><span>Target price</span></div><div><strong>68%</strong><span>Gross margin</span></div><div><strong>224</strong><span>Weekly units</span></div></div><p class="evidence-note">Use the price as the test anchor. Measure attach rate and repeat purchases before adding it to the permanent menu.</p></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark coral">02</span><div><h3>Customer language</h3><p>Supplied Yelp review corpus</p></div></div><div class="review-quote"><span class="platform yelp">Y</span><p>“Fresh and quality ingredients everywhere.”</p><b>5★</b></div><div class="review-quote"><span class="platform yelp">Y</span><p>“The black sesame latte was unique.”</p><b>5★</b></div><p class="evidence-note">Reviews support premium ingredients and distinctive drinks; they do not by themselves prove frozen-yogurt demand.</p></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark blue">03</span><div><h3>Real operator case study</h3><p>WBEZ reporting · Chicago restaurants</p></div></div><div class="case-study"><strong>Rotisserie Ema sold 800+ Greek froyos in four hours.</strong><p>Its $1 Friday walk-up promotion reached a record after week-over-week summer growth. Kouklas sold 568 cups in July and reported dessert-specific destination visits after a 20.5k-view reel.</p><a href="${sourceUrl('froyoRestaurants')}" target="_blank" rel="noreferrer">Read the WBEZ case study ↗</a></div></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark blue">04</span><div><h3>Market context</h3><p>Current public reporting</p></div></div><div class="market-list"><a href="${sourceUrl('froyoTrend')}" target="_blank" rel="noreferrer"><span>#froyo social activity</span><strong>+16% ↗</strong></a><a href="${sourceUrl('froyoRestaurants')}" target="_blank" rel="noreferrer"><span>Greek froyo launch reel</span><strong>20.5k views ↗</strong></a><a href="${sourceUrl('tatteMenu')}" target="_blank" rel="noreferrer"><span>Existing Greek-yogurt menu anchors</span><strong>2 items ↗</strong></a></div></section>` : id === 'availability' ? `
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark coral">01</span><div><h3>Back Bay action plan</h3><p>One detailed operating example</p></div></div><div class="action-steps"><div><b>1</b><p><strong>7:45 AM · Open register two</strong><span>Assign one cross-trained cashier before the commute peak and confirm drawer readiness.</span></p></div><div><b>2</b><p><strong>8:00–10:00 AM · Split the queue</strong><span>Register one handles food; register two handles beverages and pickup exceptions.</span></p></div><div><b>3</b><p><strong>Prep against observed demand</strong><span>Stage House Latte inputs at 1.25× the current par and log stockouts every 30 minutes.</span></p></div><div><b>4</b><p><strong>10:15 AM · Record the result</strong><span>Capture wait time, transactions, labor minutes, sellouts and abandoned orders.</span></p></div></div></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark teal">02</span><div><h3>Estimated business impact</h3><p>Modeled, not observed</p></div></div><div class="evidence-metrics"><div><strong>+$1.9k</strong><span>Weekly captured demand</span></div><div><strong>−2.4m</strong><span>Target wait reduction</span></div><div><strong>&lt;12%</strong><span>Labor-to-sales guardrail</span></div></div></section>` : `
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark coral">01</span><div><h3>Why this surfaced</h3><p>Connected operating evidence</p></div></div><p class="drawer-copy">${item.why}</p></section>
    <section class="evidence-section"><div class="evidence-heading"><span class="source-mark teal">02</span><div><h3>Signals to measure</h3><p>Decision proof</p></div></div><div class="proof-grid">${item.proof.map((proof) => `<span>${proof}</span>`).join('')}</div></section>`;
  drawerBody.innerHTML = `<div class="recommendation-brief"><span class="signal-chip opportunity">${item.type}</span><p>${item.title}</p><div class="confidence-row"><span>Confidence</span><strong>${item.confidence}%</strong><div><i style="width:${item.confidence}%"></i></div></div><div class="drawer-impact"><span>Estimated impact</span><strong>${item.impact}</strong><small>${item.impactLabel}</small></div></div>${context}<section class="measurement-plan"><span class="eyebrow">Reviewed 14-day measurement plan</span><div class="plan-grid"><div><b>1</b><span>Baseline</span><strong>7 days</strong></div><div><b>2</b><span>Test</span><strong>14 days</strong></div><div><b>3</b><span>Decide</span><strong>Keep / change</strong></div></div><p class="measurement-note">Primary: transactions or attach rate. Guardrails: gross margin, labor-to-sales, stockouts and rating movement. Compare against the same weekdays and dayparts.</p></section>`;
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
  const backBayDetail = id === 'backbay' ? `<section class="evidence-section"><div class="evidence-heading"><span class="source-mark blue">02</span><div><h3>What Back Bay is doing well vs. where it leaks value</h3><p>Reviews + sales + market synthesis</p></div></div><div class="strength-gap-grid"><div><span>Doing well</span><strong>Distinctive product pull</strong><p>Almond croissants and pistachio lattes earn specific praise; premium product quality supports price.</p></div><div><span>Needs work</span><strong>Morning availability + queue</strong><p>A House Latte sold out by 10 AM, while peak pressure risks turning intent into abandoned demand.</p></div></div></section>` : '';
  drawerBody.innerHTML = `<div class="recommendation-brief"><span class="signal-chip opportunity">Product mix</span><p>${location.note}. Select this location in Sales to see adjusted units and revenue.</p></div><section class="evidence-section"><div class="evidence-heading"><span class="source-mark coral">01</span><div><h3>Public review profile</h3><p>${reviewLocation ? reviewLocation.platform : 'Public sources'}</p></div></div><div class="evidence-metrics"><div><strong>${reviewLocation?.rating || '—'}</strong><span>Rating</span></div><div><strong>${reviewLocation?.count || '—'}</strong><span>Reviews</span></div><div><strong>${reviewLocation?.tone || 'Cross-location'}</strong><span>Main signal</span></div></div>${reviews.map((review) => `<div class="review-quote"><span class="platform ${review.platform.toLowerCase()}">${review.platform[0]}</span><p>“${review.text}”</p><b>${review.rating}★</b></div>`).join('')}</section>${backBayDetail}<section class="evidence-section"><div class="evidence-heading"><span class="source-mark teal">03</span><div><h3>Top modeled products</h3><p>Revenue-ranked</p></div></div><div class="market-list">${leaders.map((product) => `<div><span>${product.name}</span><strong>${money.format(product.price * product.units * location.multiplier).replace('.00','')}</strong></div>`).join('')}</div></section>`;
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
  document.querySelectorAll('[data-open-workspace]').forEach((button) => button.addEventListener('click', () => {
    const artifact = button.dataset.openWorkspace;
    render('workspace');
    setTimeout(() => focusWorkspaceArtifact(artifact), 120);
  }));
  document.querySelectorAll('[data-workspace-artifact]').forEach((button) => button.addEventListener('click', () => focusWorkspaceArtifact(button.dataset.workspaceArtifact)));
  const approveMarketing = document.getElementById('approve-marketing');
  if (approveMarketing) approveMarketing.addEventListener('click', () => {
    state.marketingStatus = 'scheduled';
    render('workspace');
    setTimeout(() => focusWorkspaceArtifact('campaign-kit'), 120);
    showToast('Instagram campaign approved and scheduled in the marketing workflow.');
  });
  const regenerateMarketing = document.getElementById('regenerate-marketing');
  if (regenerateMarketing) regenerateMarketing.addEventListener('click', () => {
    state.marketingRevision = (state.marketingRevision + 1) % marketingVariants.length;
    state.marketingStatus = 'draft';
    render('workspace');
    setTimeout(() => focusWorkspaceArtifact('campaign-kit'), 120);
    showToast('Marketing agent generated a new campaign angle.');
  });
  const copyCaption = document.getElementById('copy-marketing-caption');
  if (copyCaption) copyCaption.addEventListener('click', async () => {
    const captionText = marketingVariants[state.marketingRevision % marketingVariants.length].caption;
    try { await navigator.clipboard.writeText(`${captionText} #GreekFroyo #BostonEats #AfternoonAtTatte`); showToast('Instagram caption copied.'); }
    catch { showToast('Caption ready: select the post copy to copy it.'); }
  });
  const chatForm = document.getElementById('chat-form');
  if (chatForm) chatForm.addEventListener('submit', (event) => { event.preventDefault(); const input = document.getElementById('chat-input'); askStoreline(input.value); input.value = ''; });
  const clearChat = document.getElementById('clear-chat');
  if (clearChat) clearChat.addEventListener('click', () => { state.chat = state.chat.slice(0, 1); renderChat(); });
  const runButton = document.getElementById('run-playbook');
  if (runButton) runButton.addEventListener('click', runPlaybook);
  const decisionLocation = document.getElementById('decision-location-filter');
  if (decisionLocation) decisionLocation.onchange = () => { state.nextLocation = decisionLocation.value; renderRecommendations(); bindViewEvents(); };
  const decisionType = document.getElementById('decision-type-filter');
  if (decisionType) decisionType.onchange = () => { state.nextType = decisionType.value; renderRecommendations(); bindViewEvents(); };
  const clearFilters = document.getElementById('clear-decision-filters');
  if (clearFilters) clearFilters.onclick = () => { state.nextLocation = 'all'; state.nextType = 'all'; renderRecommendations(); bindViewEvents(); };
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
const accountButton = document.getElementById('account-button');
const accountMenu = document.getElementById('account-menu');
accountButton.addEventListener('click', (event) => {
  event.stopPropagation();
  const opening = accountMenu.hidden;
  accountMenu.hidden = !opening;
  accountButton.setAttribute('aria-expanded', String(opening));
});
accountMenu.querySelectorAll('[data-account-action]').forEach((button) => button.addEventListener('click', () => {
  showToast(`${button.dataset.accountAction} is available in the full workspace.`);
  accountMenu.hidden = true;
  accountButton.setAttribute('aria-expanded', 'false');
}));
document.addEventListener('click', (event) => { if (!accountMenu.hidden && !accountMenu.contains(event.target)) { accountMenu.hidden = true; accountButton.setAttribute('aria-expanded', 'false'); } });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeDrawer(); accountMenu.hidden = true; accountButton.setAttribute('aria-expanded', 'false'); } });

render('today');
loadRuntimeStatus();
