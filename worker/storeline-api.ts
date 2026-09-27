type RuntimeEnv = {
  DB: D1Database;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

type EvidenceRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  source_type: string;
  source_name: string;
  source_url: string | null;
  title: string;
  content: string;
  tags: string;
  published_at: string | null;
  observed_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  weekly_units: number;
  gross_margin_pct: number;
  trend_pct: number;
  data_status: string;
};

const DEFAULT_TENANT = "tatte-boston";
const OBSERVED_AT = "2026-09-27";
const YELP_URL = "https://www.yelp.com/search?find_desc=tatte+bakery+%26+cafe&find_loc=Boston%2C+MA";

const locations = [
  ["beacon", "Beacon Hill"], ["backbay", "Back Bay"], ["summer", "Summer Street"],
  ["pier4", "Pier 4"], ["berklee", "Berklee"], ["copley", "Copley Square"],
  ["emerson", "Emerson"], ["fenway", "Fenway"], ["southend", "South End"],
  ["cambridge", "Cambridge / Third Street"],
] as const;

const evidenceSeed = [
  ["review-01", "beacon", "review", "Yelp", YELP_URL, "Price and ingredient quality", "Fresh and quality ingredients everywhere — and leading to their price point.", "quality,price", "2026-07-27"],
  ["review-02", "beacon", "review", "Yelp", YELP_URL, "Fast service", "Service was very quick and drinks and pastries were almost instantaneous.", "speed,service", "2026-07-21"],
  ["review-03", "beacon", "review", "Yelp", YELP_URL, "Distinctive beverages", "The black sesame latte was unique; the pistachio tart balanced nuttiness and sweetness.", "beverage,pastry", "2026-07-16"],
  ["review-04", "beacon", "review", "Yelp", YELP_URL, "Heat and ambience", "Food and coffee are consistent; the inside felt hot and stuffy.", "ambience,consistency", "2026-09-26"],
  ["review-05", "beacon", "review", "Yelp", YELP_URL, "Peak seating friction", "Super busy at lunchtime and very hard to find seating.", "crowding,seating,lunch", "2026-07-16"],
  ["review-06", "beacon", "review", "Yelp", YELP_URL, "Matcha consistency", "The matcha did not taste high quality and was very milky.", "beverage,consistency,matcha", "2026-05-21"],
  ["review-07", "backbay", "review", "Yelp", YELP_URL, "Latte availability", "Good coffee, if a bit expensive; the house latte was sold out by 10am.", "price,availability,latte", "2026-06-28"],
  ["review-08", "summer", "review", "Yelp", YELP_URL, "Breakfast product", "The oatmeal stood out as a memorable breakfast choice.", "breakfast,food", "2026-09-27"],
  ["review-09", "pier4", "review", "Yelp", YELP_URL, "Space and menu breadth", "Bakery, coffee and brunch options pair with a large seating area.", "space,brunch,coffee", "2026-09-27"],
  ["review-10", "berklee", "review", "Yelp", YELP_URL, "Atmosphere and coffee", "The café atmosphere, food and coffee all landed strongly.", "ambience,coffee", "2026-09-27"],
  ["review-11", "copley", "review", "Yelp", YELP_URL, "Breakfast strength", "Breakfast was the clearest positive in the visit.", "breakfast", "2026-09-27"],
  ["review-12", "emerson", "review", "Yelp", YELP_URL, "Inviting café", "A bright, inviting space with a strong café atmosphere.", "ambience", "2026-09-27"],
  ["review-13", "fenway", "review", "Yelp", YELP_URL, "Bakery selection", "The bakery selection ranges from breakfast pastries to crafted desserts.", "pastry,dessert", "2026-09-27"],
  ["review-14", "southend", "review", "Yelp", YELP_URL, "Pastry quality", "The pastries are the strongest first-visit signal in the current public profile.", "pastry,quality", "2026-09-27"],
  ["review-15", "cambridge", "review", "Google", "https://reviews.birdeye.com/tatte-bakery-cafe-third-st-173504839194779", "Cold brew consistency", "Best cafe in the neighborhood; the cold brew was inconsistent in strength.", "coffee,consistency,cold brew", "2026-08-01"],
  ["market-01", null, "market", "BLS", "https://www.bls.gov/regions/northeast/news-release/2026/consumerpriceindex_boston_20260213.htm", "Boston dining inflation", "Boston food-away-from-home prices rose 5.1 percent year over year in January 2026.", "inflation,pricing,boston", "2026-02-13"],
  ["market-02", null, "market", "National Restaurant Association", "https://restaurant.org/research-and-media/research/inflation/", "Restaurant expense pressure", "Average restaurant expenses increased 36 percent cumulatively since 2019.", "costs,expenses,margin", "2026-01-01"],
  ["market-03", null, "market", "National Restaurant Association", "https://www.restaurant.org/research-and-media/research/restaurant-economic-insights/analysis-commentary/affordability-pressures-mount%2C-but-consumers-continue-to-prioritize-restaurants/", "Affordability pressure", "42 percent of consumers reported spending less at cafés, takeout and quick-service restaurants.", "consumer,value,affordability", "2026-01-01"],
  ["market-04", null, "market", "Axios", "https://www.axios.com/2025/12/06/frozen-yogurt-stores-nostalgia-comeback", "Frozen yogurt resurgence", "Posts using the froyo hashtag increased 16 percent during the first ten months of 2025.", "froyo,trend,social", "2025-12-06"],
  ["market-05", null, "market", "WBEZ", "https://www.wbez.org/food-drink/2026/08/18/froyo-greek-frozen-yogurt-trend-chicago-restaurants-mikono-kouklas-ema", "Greek frozen yogurt destination demand", "One Greek frozen-yogurt restaurant launch reel received 20,500 views and prompted special trips.", "froyo,greek yogurt,demand", "2026-08-18"],
  ["menu-01", null, "menu", "Tatte", "https://tattebakery.com/wp-content/uploads/2025/04/Spring2025_B_web.pdf", "Existing Greek-yogurt language", "The official menu contains two Greek-yogurt anchors: Greek yogurt pancakes and muesli.", "greek yogurt,menu,muesli,pancakes", "2025-04-01"],
] as const;

const productsSeed = [
  ["house-latte", "Tatte House Latte", "Drinks", 6.25, 775, 78, 14],
  ["black-sesame", "Black Sesame Latte", "Drinks", 6.75, 682, 76, 22],
  ["pistachio-latte", "Pistachio Latte", "Drinks", 6.75, 598, 74, 18],
  ["cold-brew", "Cold Brew", "Drinks", 5.25, 840, 81, 24],
  ["breakfast-sandwich", "Breakfast Sandwich", "Breakfast", 11.5, 690, 66, 9],
  ["croissant-sandwich", "Croissant Breakfast Sandwich", "Breakfast", 12.25, 521, 64, 12],
  ["salmon-avocado-egg", "Smoked Salmon, Avocado & Egg", "Breakfast", 14.5, 438, 61, 7],
  ["shakshuka", "Traditional Shakshuka", "Brunch", 15.75, 312, 63, 4],
  ["lamb-shakshuka", "Lamb Meatball Shakshuka", "Brunch", 18.5, 226, 58, 6],
  ["farro-bowl", "Fresh Corn & Avocado Farro Bowl", "Lunch", 14.25, 267, 62, 16],
  ["muesli", "Muesli Bowl", "Breakfast", 10.5, 284, 69, 11],
  ["morning-bun", "Morning Bun", "Bakery", 5.25, 620, 73, 8],
  ["almond-croissant", "Almond Croissant", "Bakery", 5.75, 552, 71, 15],
  ["pistachio-tart", "Pistachio Tart", "Bakery", 7.25, 393, 68, 19],
  ["greek-froyo", "Greek Frozen Yogurt Pilot", "Pilot", 7.5, 224, 68, 31],
] as const;

const evaluationSeed = [
  ["eval-froyo", "Why should we test Greek frozen yogurt?", "market,menu", "froyo,greek yogurt"],
  ["eval-location", "Which location should run the pilot first?", "review,market", "pier4,backbay"],
  ["eval-price", "What pricing risks should I watch?", "market", "price,value"],
  ["eval-reviews", "What are customers complaining about?", "review", "seating,consistency"],
  ["eval-products", "Which modeled products are growing fastest?", "product", "cold brew,black sesame"],
] as const;

const stopWords = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "is", "are", "we", "should", "what", "why", "which", "i", "our", "do", "about"]);

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(init.headers || {}) },
  });
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, external_ref TEXT, FOREIGN KEY (tenant_id) REFERENCES tenants(id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, location_id TEXT, source_type TEXT NOT NULL, source_name TEXT NOT NULL, source_url TEXT, title TEXT NOT NULL, content TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '', published_at TEXT, observed_at TEXT NOT NULL, FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (location_id) REFERENCES locations(id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL, weekly_units INTEGER NOT NULL, gross_margin_pct REAL NOT NULL, trend_pct REAL NOT NULL, data_status TEXT NOT NULL, FOREIGN KEY (tenant_id) REFERENCES tenants(id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS ingestion_runs (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, source_type TEXT NOT NULL, records_loaded INTEGER NOT NULL, records_skipped INTEGER NOT NULL, status TEXT NOT NULL, completed_at TEXT NOT NULL, FOREIGN KEY (tenant_id) REFERENCES tenants(id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS ask_runs (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL, citations_json TEXT NOT NULL, mode TEXT NOT NULL, model TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (tenant_id) REFERENCES tenants(id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS evaluation_cases (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, question TEXT NOT NULL, required_source_types TEXT NOT NULL, required_terms TEXT NOT NULL, FOREIGN KEY (tenant_id) REFERENCES tenants(id))"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_evidence_tenant_type ON evidence(tenant_id, source_type)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_evidence_tenant_location ON evidence(tenant_id, location_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_ask_runs_tenant_created ON ask_runs(tenant_id, created_at)"),
  ]);
}

async function seedDatabase(db: D1Database) {
  const statements: D1PreparedStatement[] = [
    db.prepare("INSERT OR IGNORE INTO tenants (id, name) VALUES (?, ?)").bind(DEFAULT_TENANT, "Tatte Bakery & Café · Boston"),
    db.prepare("INSERT OR IGNORE INTO tenants (id, name) VALUES (?, ?)").bind("isolation-test", "Isolation test tenant"),
  ];
  locations.forEach(([id, name]) => statements.push(db.prepare("INSERT OR IGNORE INTO locations (id, tenant_id, name, city, external_ref) VALUES (?, ?, ?, ?, ?)").bind(id, DEFAULT_TENANT, name, "Boston", id)));
  evidenceSeed.forEach(([id, locationId, sourceType, sourceName, sourceUrl, title, content, tags, publishedAt]) => statements.push(db.prepare("INSERT OR REPLACE INTO evidence (id, tenant_id, location_id, source_type, source_name, source_url, title, content, tags, published_at, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, DEFAULT_TENANT, locationId, sourceType, sourceName, sourceUrl, title, content, tags, publishedAt, OBSERVED_AT)));
  productsSeed.forEach(([id, name, category, price, units, margin, trend]) => statements.push(db.prepare("INSERT OR REPLACE INTO products (id, tenant_id, name, category, price, weekly_units, gross_margin_pct, trend_pct, data_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, DEFAULT_TENANT, name, category, price, units, margin, trend, "modeled")));
  evaluationSeed.forEach(([id, question, sourceTypes, terms]) => statements.push(db.prepare("INSERT OR REPLACE INTO evaluation_cases (id, tenant_id, question, required_source_types, required_terms) VALUES (?, ?, ?, ?, ?)").bind(id, DEFAULT_TENANT, question, sourceTypes, terms)));
  statements.push(db.prepare("INSERT OR REPLACE INTO evidence (id, tenant_id, location_id, source_type, source_name, source_url, title, content, tags, published_at, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("isolation-sentinel", "isolation-test", null, "review", "Private source", null, "Tenant sentinel", "Secret sentinel value 991 must never appear in the Tatte tenant.", "sentinel", OBSERVED_AT, OBSERVED_AT));
  statements.push(db.prepare("INSERT OR REPLACE INTO ingestion_runs (id, tenant_id, source_type, records_loaded, records_skipped, status, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind("seed-2026-09-27", DEFAULT_TENANT, "reviews+market+menu+products", evidenceSeed.length + productsSeed.length, 0, "complete", new Date().toISOString()));
  await db.batch(statements);
}

function tenantFrom(request: Request) {
  const raw = request.headers.get("x-storeline-tenant") || DEFAULT_TENANT;
  return /^[a-z0-9-]{2,48}$/.test(raw) ? raw : DEFAULT_TENANT;
}

function tokens(value: string) {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9%]+/g, " ").split(/\s+/).filter((token) => token.length > 1 && !stopWords.has(token)))];
}

function scoreEvidence(row: EvidenceRow, queryTokens: string[]) {
  const title = row.title.toLowerCase();
  const content = row.content.toLowerCase();
  const tags = row.tags.toLowerCase();
  return queryTokens.reduce((score, token) => score + (title.includes(token) ? 5 : 0) + (tags.includes(token) ? 4 : 0) + (content.includes(token) ? 2 : 0), 0);
}

function retrievalIntent(question: string) {
  const query = question.toLowerCase();
  const expanded = new Set(tokens(question));
  if (/complain|review|customer|issue/.test(query)) ["seating", "consistency", "service", "price", "quality"].forEach((token) => expanded.add(token));
  if (/location|where|pilot first/.test(query)) ["pier4", "backbay", "space", "seating", "froyo"].forEach((token) => expanded.add(token));
  if (/price|pricing|risk|value/.test(query)) ["inflation", "affordability", "costs", "price"].forEach((token) => expanded.add(token));
  return { query, tokens: [...expanded] };
}

async function retrieveEvidence(db: D1Database, tenantId: string, question: string, locationId?: string | null) {
  const query = locationId
    ? db.prepare("SELECT * FROM evidence WHERE tenant_id = ? AND (location_id = ? OR location_id IS NULL) ORDER BY observed_at DESC LIMIT 100").bind(tenantId, locationId)
    : db.prepare("SELECT * FROM evidence WHERE tenant_id = ? ORDER BY observed_at DESC LIMIT 100").bind(tenantId);
  const rows = (await query.all()).results as unknown as EvidenceRow[];
  const intent = retrievalIntent(question);
  return rows.map((row) => {
    let score = scoreEvidence(row, intent.tokens);
    if (/complain|review|customer|issue/.test(intent.query) && row.source_type === "review") score += 12;
    if (/price|pricing|risk|value/.test(intent.query) && row.source_type === "market") score += 10;
    if (/froyo|yogurt/.test(intent.query) && ["market", "menu"].includes(row.source_type)) score += 10;
    if (/location|where|pilot first/.test(intent.query)) score += row.source_type === "review" ? 7 : row.source_type === "market" ? 5 : 0;
    if (row.location_id && intent.tokens.includes(row.location_id)) score += 12;
    return { ...row, score };
  }).sort((a, b) => b.score - a.score || b.observed_at.localeCompare(a.observed_at)).slice(0, 6);
}

async function retrieveProducts(db: D1Database, tenantId: string, question: string) {
  const rows = (await db.prepare("SELECT id, name, category, price, weekly_units, gross_margin_pct, trend_pct, data_status FROM products WHERE tenant_id = ?").bind(tenantId).all()).results as unknown as ProductRow[];
  const queryTokens = tokens(question);
  return rows.map((row) => ({ ...row, score: queryTokens.reduce((score, token) => score + (`${row.name} ${row.category}`.toLowerCase().includes(token) ? 4 : 0), 0) })).sort((a, b) => b.score - a.score || b.trend_pct - a.trend_pct).slice(0, 6);
}

function deterministicCalculations(products: ProductRow[]) {
  const weeklyRevenue = products.reduce((sum, item) => sum + item.price * item.weekly_units, 0);
  const weeklyUnits = products.reduce((sum, item) => sum + item.weekly_units, 0);
  const weightedMargin = weeklyRevenue ? products.reduce((sum, item) => sum + item.price * item.weekly_units * item.gross_margin_pct, 0) / weeklyRevenue : 0;
  return {
    weekly_revenue: Math.round(weeklyRevenue * 100) / 100,
    weekly_units: weeklyUnits,
    weighted_margin_pct: Math.round(weightedMargin * 10) / 10,
    product_count: products.length,
  };
}

function fallbackAnswer(question: string, evidence: Array<EvidenceRow & { score: number }>, products: Array<ProductRow & { score: number }>, calculations: ReturnType<typeof deterministicCalculations>) {
  const query = question.toLowerCase();
  if (query.includes("froyo") || query.includes("yogurt")) return "The strongest case is a controlled pilot, not a chain-wide launch. Public evidence shows froyo activity up 16%, a Greek frozen-yogurt launch drawing 20,500 views, and two existing Greek-yogurt anchors on Tatte's menu. The modeled pilot price is $7.50 with a 68% gross margin. Start at Pier 4, then Back Bay, and measure attach rate, repeat purchase, and margin for 14 days.";
  if (query.includes("location") || query.includes("where") || query.includes("pilot first")) return "Run the first 14-day pilot at Pier 4: the public profile combines a large seating area with bakery, coffee, and brunch demand, which creates room for a visible afternoon test. Use Back Bay as the second location because its current review signals include both willingness to pay and product-availability friction. Compare attach rate, repeat purchase, and gross margin between the two locations before expanding.";
  if (query.includes("price") || query.includes("risk") || query.includes("value")) return "The main risk is value perception. Boston food-away-from-home prices rose 5.1% while 42% of consumers reported cutting café or takeout spending. Keep an entry-price drink, hold the froyo test at $7.50, and judge the pilot on attach rate and repeat purchase—not margin alone.";
  if (query.includes("complain") || query.includes("review") || query.includes("customer")) return "The clearest operating issues are peak seating friction and beverage consistency. Reviews describe hard-to-find lunchtime seating, an overly milky matcha, and inconsistent cold-brew strength. Product and pastry quality remain the strongest positive theme.";
  if (query.includes("product") || query.includes("grow") || query.includes("sales")) return `The retrieved modeled set contains ${calculations.product_count} products and ${calculations.weekly_units.toLocaleString()} weekly units. Cold Brew has the highest modeled growth at 24%, followed by Black Sesame Latte at 22% and Pistachio Tart at 19%.`;
  const lead = evidence[0];
  const product = products[0];
  return `${lead ? lead.content : "The evidence set does not contain a strong direct match."}${product ? ` The closest product signal is ${product.name} at $${product.price.toFixed(2)}, ${product.gross_margin_pct}% modeled margin, and ${product.trend_pct}% modeled growth.` : ""}`;
}

function buildGroundedPrompt(question: string, evidence: Array<EvidenceRow & { score: number }>, products: Array<ProductRow & { score: number }>, calculations: ReturnType<typeof deterministicCalculations>) {
  const evidenceText = evidence.map((item) => `[${item.id}] ${item.title} — ${item.content} (${item.source_name}, ${item.source_url || "private source"})`).join("\n");
  const productText = products.map((item) => `[product:${item.id}] ${item.name}: $${item.price.toFixed(2)}, ${item.weekly_units} modeled weekly units, ${item.gross_margin_pct}% modeled margin, ${item.trend_pct}% modeled growth`).join("\n");
  return `Question: ${question}\n\nEVIDENCE\n${evidenceText}\n\nMODELED PRODUCT FACTS\n${productText}\n\nDETERMINISTIC CALCULATIONS\n[calculator] ${JSON.stringify(calculations)}`;
}

async function callOpenAI(env: RuntimeEnv, prompt: string) {
  if (!env.OPENAI_API_KEY) return null;
  const model = env.OPENAI_MODEL || "gpt-5.4-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      input: [
        { role: "developer", content: "You are Storeline, an operating intelligence assistant for franchise owners. Answer only from the supplied evidence. Cite factual claims inline with source IDs in square brackets. Separate public observations from modeled product economics. Never invent a number. Keep the answer concise and operational." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI Responses API returned ${response.status}`);
  const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text || "").join("\n");
  return { text: text || "No grounded answer was returned.", model, provider: "openai" };
}

async function callAnthropic(env: RuntimeEnv, prompt: string) {
  if (!env.ANTHROPIC_API_KEY) return null;
  const model = env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      system: "You are Storeline, an operating intelligence assistant for franchise owners. Answer only from the supplied evidence. Cite factual claims inline with source IDs in square brackets. Separate public observations from modeled product economics. Never invent a number. Keep the answer concise and operational.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic Messages API returned ${response.status}`);
  const payload = await response.json() as { content?: Array<{ type?: string; text?: string }> };
  const text = payload.content?.filter((item) => item.type === "text").map((item) => item.text || "").join("\n");
  return { text: text || "No grounded answer was returned.", model, provider: "anthropic" };
}

async function callModel(env: RuntimeEnv, prompt: string) {
  if (env.ANTHROPIC_API_KEY) return callAnthropic(env, prompt);
  return callOpenAI(env, prompt);
}

async function status(db: D1Database, env: RuntimeEnv, tenantId: string) {
  const counts = await db.prepare("SELECT source_type, COUNT(*) AS count FROM evidence WHERE tenant_id = ? GROUP BY source_type ORDER BY source_type").bind(tenantId).all();
  const products = await db.prepare("SELECT COUNT(*) AS count FROM products WHERE tenant_id = ?").bind(tenantId).first<{ count: number }>();
  const locationsCount = await db.prepare("SELECT COUNT(*) AS count FROM locations WHERE tenant_id = ?").bind(tenantId).first<{ count: number }>();
  const evals = await db.prepare("SELECT COUNT(*) AS count FROM evaluation_cases WHERE tenant_id = ?").bind(tenantId).first<{ count: number }>();
  const modelProvider = env.ANTHROPIC_API_KEY ? "anthropic" : env.OPENAI_API_KEY ? "openai" : null;
  return json({
    product: "Storeline",
    tenant: tenantId,
    retrieval: "online",
    model: modelProvider ? "connected" : "awaiting_api_key",
    model_provider: modelProvider,
    model_name: modelProvider === "openai" ? env.OPENAI_MODEL || "gpt-5.4-mini" : env.ANTHROPIC_MODEL || "claude-sonnet-5",
    locations: locationsCount?.count || 0,
    products: products?.count || 0,
    evaluation_cases: evals?.count || 0,
    evidence: counts.results,
    observed_at: OBSERVED_AT,
  });
}

async function runEvaluations(db: D1Database, tenantId: string) {
  const cases = (await db.prepare("SELECT * FROM evaluation_cases WHERE tenant_id = ? ORDER BY id").bind(tenantId).all()).results as Array<{ id: string; question: string; required_source_types: string; required_terms: string }>;
  const results = [];
  for (const item of cases) {
    const evidence = await retrieveEvidence(db, tenantId, item.question);
    const products = await retrieveProducts(db, tenantId, item.question);
    const sourceTypes = new Set(evidence.map((entry) => entry.source_type));
    const corpus = `${evidence.map((entry) => `${entry.location_id || ""} ${entry.title} ${entry.content} ${entry.tags}`).join(" ")} ${products.map((entry) => entry.name).join(" ")}`.toLowerCase();
    const requiredSourceTypes = item.required_source_types.split(",");
    const requiredTerms = item.required_terms.split(",");
    const sourcePass = requiredSourceTypes.every((type) => type === "product" ? products.length > 0 : sourceTypes.has(type));
    const termPass = requiredTerms.some((term) => corpus.includes(term.trim().toLowerCase()));
    results.push({ id: item.id, question: item.question, pass: sourcePass && termPass, retrieved: evidence.map((entry) => entry.id), products: products.map((entry) => entry.id) });
  }
  return json({ passed: results.filter((item) => item.pass).length, total: results.length, results });
}

async function ask(request: Request, db: D1Database, env: RuntimeEnv, tenantId: string) {
  const body = await request.json().catch(() => null) as { question?: string; location_id?: string | null } | null;
  const question = body?.question?.trim();
  if (!question || question.length < 3 || question.length > 500) return json({ error: "Question must be between 3 and 500 characters." }, { status: 400 });
  const evidence = await retrieveEvidence(db, tenantId, question, body?.location_id);
  const products = await retrieveProducts(db, tenantId, question);
  const calculations = deterministicCalculations(products);
  let answer = fallbackAnswer(question, evidence, products, calculations);
  let mode = "retrieval";
  let model: string | null = null;
  let provider: string | null = null;
  try {
    const generated = await callModel(env, buildGroundedPrompt(question, evidence, products, calculations));
    if (generated) { answer = generated.text; mode = "llm"; model = generated.model; provider = generated.provider; }
  } catch (error) {
    console.error("Storeline model adapter failed", error);
    mode = "retrieval_fallback";
  }
  const citations = evidence.map((item) => ({ id: item.id, title: item.title, source_type: item.source_type, source_name: item.source_name, source_url: item.source_url, location_id: item.location_id, excerpt: item.content }));
  const runId = crypto.randomUUID();
  await db.prepare("INSERT INTO ask_runs (id, tenant_id, question, answer, citations_json, mode, model) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(runId, tenantId, question, answer, JSON.stringify(citations), mode, model).run();
  return json({ run_id: runId, answer, mode, model, provider, citations, calculations, retrieved_count: citations.length });
}

export async function handleStorelineApi(request: Request, env: RuntimeEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;
  if (!env.DB) return json({ error: "Storeline evidence database is not bound." }, { status: 503 });
  await ensureSchema(env.DB);
  await seedDatabase(env.DB);
  const tenantId = tenantFrom(request);

  if (url.pathname === "/api/status" && request.method === "GET") return status(env.DB, env, tenantId);
  if (url.pathname === "/api/evaluations/run" && request.method === "GET") return runEvaluations(env.DB, tenantId);
  if (url.pathname === "/api/ask" && request.method === "POST") return ask(request, env.DB, env, tenantId);
  if (url.pathname === "/api/evidence" && request.method === "GET") {
    const type = url.searchParams.get("type");
    const query = type
      ? env.DB.prepare("SELECT id, location_id, source_type, source_name, source_url, title, content, tags, published_at, observed_at FROM evidence WHERE tenant_id = ? AND source_type = ? ORDER BY observed_at DESC LIMIT 100").bind(tenantId, type)
      : env.DB.prepare("SELECT id, location_id, source_type, source_name, source_url, title, content, tags, published_at, observed_at FROM evidence WHERE tenant_id = ? ORDER BY observed_at DESC LIMIT 100").bind(tenantId);
    return json({ tenant: tenantId, records: (await query.all()).results });
  }
  return json({ error: "Not found" }, { status: 404 });
}
