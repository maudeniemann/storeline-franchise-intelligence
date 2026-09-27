const root = document.getElementById('view-root');
const viewLabel = document.getElementById('view-label');
const drawer = document.getElementById('evidence-drawer');
const backdrop = document.getElementById('drawer-backdrop');
const toast = document.getElementById('toast');

const state = {
  view: 'today',
  signal: 'sales',
  pilotApproved: false,
  approvals: new Set(),
};

const labels = { today: 'Today', locations: 'Locations', signals: 'Signals', decisions: 'Decisions' };

const signalViews = {
  sales: `
    <div class="signal-content">
      <div class="signal-copy"><span class="eyebrow">Private operating data · Demo</span><h2>Afternoon cold drinks are pulling ahead.</h2><p>Across 8,421 curated synthetic transactions, iced drinks are the fastest-growing category. Dessert attachment remains low after lunch, creating the commercial opening behind the pilot.</p><div class="signal-stat-row"><div><strong>+24%</strong><span>Iced drink units</span></div><div><strong>8.6%</strong><span>Dessert attach</span></div><div><strong>$25.51</strong><span>Average ticket</span></div></div></div>
      <div class="visual-card"><div class="bar-chart"><span style="height:48%"><b>Mon</b></span><span style="height:56%"><b>Tue</b></span><span style="height:52%"><b>Wed</b></span><span style="height:72%"><b>Thu</b></span><span style="height:85%"><b>Fri</b></span><span style="height:96%"><b>Sat</b></span><span style="height:82%"><b>Sun</b></span></div></div>
    </div>`,
  reviews: `
    <div class="signal-content">
      <div class="signal-copy"><span class="eyebrow">Public customer signal · Demo</span><h2>Customers describe one need in different words.</h2><p>Kernel grouped Google- and Yelp-style synthetic reviews by intent. “Something cold,” “lighter dessert,” and “Greek yogurt” resolve to one recurring demand pattern.</p><div class="signal-stat-row"><div><strong>126</strong><span>New reviews</span></div><div><strong>37</strong><span>Related mentions</span></div><div><strong>+64%</strong><span>Theme velocity</span></div></div></div>
      <div class="visual-card"><div class="review-stream"><div class="review-quote"><span class="platform google">G</span><p>“Would love something cold and lighter after lunch.”</p><b>5.0</b></div><div class="review-quote"><span class="platform yelp">Y</span><p>“In summer I go elsewhere for a light dessert.”</p><b>4.0</b></div><div class="review-quote"><span class="platform google">G</span><p>“Frozen yogurt would be perfect with the iced coffee.”</p><b>4.0</b></div></div></div>
    </div>`,
  market: `
    <div class="signal-content">
      <div class="signal-copy"><span class="eyebrow">External market context · Demo</span><h2>Nearby menus are moving toward Greek frozen yogurt.</h2><p>Nine of fourteen tracked competitors now list a Greek-yogurt or frozen-yogurt item. Local search interest is rising fastest around Seaport, where direct supply remains lowest.</p><div class="signal-stat-row"><div><strong>9 / 14</strong><span>Menus carrying item</span></div><div><strong>+31%</strong><span>Search interest</span></div><div><strong>$7.80</strong><span>Median price</span></div></div></div>
      <div class="visual-card"><div class="market-chart"><div class="market-legend"><span><i class="teal"></i>Your group</span><span><i class="coral"></i>Competitor adoption</span></div><svg viewBox="0 0 520 220" preserveAspectRatio="none"><path class="baseline" d="M0 172 H520"/><path class="ours" d="M0 168 C85 160 132 157 196 151 S333 145 520 137"/><path class="comp" d="M0 174 C76 167 116 143 178 135 S304 87 370 70 S465 43 520 29"/></svg></div></div>
    </div>`,
};

function render(view = state.view) {
  state.view = view;
  const template = document.getElementById(`${view}-template`);
  root.replaceChildren(template.content.cloneNode(true));
  viewLabel.textContent = labels[view];
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  if (view === 'signals') renderSignal(state.signal);
  if (view === 'decisions') syncDecisionUI();
  bindViewEvents();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSignal(signal) {
  state.signal = signal;
  const detail = document.getElementById('signal-detail');
  if (detail) detail.innerHTML = signalViews[signal];
  document.querySelectorAll('[data-signal]').forEach((button) => button.classList.toggle('active', button.dataset.signal === signal));
}

function bindViewEvents() {
  document.querySelectorAll('[data-view-jump]').forEach((button) => button.addEventListener('click', () => render(button.dataset.viewJump)));
  document.querySelectorAll('.open-evidence').forEach((button) => button.addEventListener('click', openDrawer));
  document.querySelectorAll('[data-signal]').forEach((button) => button.addEventListener('click', () => renderSignal(button.dataset.signal)));
  document.querySelectorAll('.segmented button').forEach((button) => button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    showToast(`Location comparison updated to ${button.textContent}.`);
  }));
  document.querySelectorAll('[data-location]').forEach((button) => button.addEventListener('click', () => showLocation(button.dataset.location)));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => showAction(button.dataset.action)));
  document.querySelectorAll('[data-approve]').forEach((button) => button.addEventListener('click', () => approveAssignment(button.dataset.approve, button)));
  document.querySelectorAll('.approve-inline').forEach((button) => button.addEventListener('click', approvePilot));
}

function openDrawer() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add('visible'));
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
}

function approvePilot() {
  if (state.pilotApproved) {
    showToast('The 14-day pilot is already in the decision log.');
    closeDrawer();
    return;
  }
  state.pilotApproved = true;
  document.getElementById('decision-count').textContent = '2';
  showToast('Pilot approved · Back Bay and Seaport · starts Sep 29');
  closeDrawer();
  if (state.view === 'decisions') syncDecisionUI();
}

function syncDecisionUI() {
  const pilot = document.getElementById('pilot-decision');
  const openCount = document.getElementById('open-decision-count');
  const approvedCount = document.getElementById('approved-decision-count');
  if (!pilot || !openCount || !approvedCount) return;
  const totalApproved = 1 + state.approvals.size + (state.pilotApproved ? 1 : 0);
  const totalOpen = 3 - state.approvals.size - (state.pilotApproved ? 1 : 0);
  openCount.textContent = totalOpen;
  approvedCount.textContent = totalApproved;
  if (state.pilotApproved) {
    pilot.classList.add('approved-card');
    pilot.querySelector('.decision-meta').innerHTML = '<span class="signal-chip approved">Approved</span><span>Starts Sep 29</span><span>Back Bay · Seaport</span>';
    pilot.querySelector('.decision-actions').innerHTML = '<span class="approved-label">Pilot in decision log ✓</span>';
  }
}

function approveAssignment(type, button) {
  if (state.approvals.has(type)) return;
  state.approvals.add(type);
  button.textContent = 'Assigned ✓';
  button.disabled = true;
  const remaining = 3 - state.approvals.size - (state.pilotApproved ? 1 : 0);
  document.getElementById('decision-count').textContent = remaining;
  syncDecisionUI();
  showToast(type === 'queue' ? 'Lunch coverage assigned to the Back Bay manager.' : 'Payment audit assigned to the Cambridge manager.');
}

function showLocation(location) {
  const stories = {
    'Back Bay': 'Back Bay · Lunch demand +11.2%; median peak wait reached 12 minutes. Recommended: second register, 11:30–1:30.',
    'Seaport': 'Seaport · Iced drinks +24%; strongest modeled site for the frozen-yogurt pilot.',
    'Cambridge': 'Cambridge · 11 payment-friction mentions after the POS change; completed peak-hour tickets −3.4%.',
    'South End': 'South End · 24 positive mentions name specific team members; replicate its opening-shift huddle.',
  };
  showToast(stories[location]);
}

function showAction(type) {
  showToast(type === 'queue' ? 'Action plan · Add register 2 from 11:30–1:30 for seven days; compare wait time and ticket completion.' : 'Action plan · Run five test payments, inspect failure logs, and compare completion before and after the POS change.');
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => render(button.dataset.view)));
document.querySelectorAll('.close-drawer').forEach((button) => button.addEventListener('click', closeDrawer));
backdrop.addEventListener('click', closeDrawer);
document.getElementById('approve-pilot').addEventListener('click', approvePilot);
document.getElementById('help-button').addEventListener('click', () => showToast('Kernel demo · All sales, reviews, and market records are curated synthetic fixtures.'));
document.getElementById('account-button').addEventListener('click', () => showToast('Tatte Bakery & Café · Boston region · 4 demo locations'));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

render('today');
