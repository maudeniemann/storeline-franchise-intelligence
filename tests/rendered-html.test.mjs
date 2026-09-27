import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Storeline application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Storeline — Franchise Intelligence<\/title>/i);
  assert.match(html, /<iframe[^>]+src="\/demo\/index\.html"/i);
  assert.match(html, /title="Storeline franchise intelligence"/i);
});

test("ships the six working product surfaces and grounded data layer", async () => {
  const [page, index, app, data, css, api, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/data.js", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../worker/storeline-api.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /src="\/demo\/index\.html"/);
  for (const view of ["today", "reviews", "pricing", "market", "next", "assistant"]) {
    assert.match(index, new RegExp(`data-view="${view}"`));
    assert.match(index, new RegExp(`id="${view}-template"`));
  }
  assert.match(index, /Ask anything\. Then turn the answer into work\./);
  assert.match(index, /<span>Sales<\/span>/);
  assert.match(index, /Sales performance and product mix, by location\./);
  assert.match(index, /id="sales-synthesis"/);
  assert.match(index, /id="review-synthesis"/);
  assert.match(index, /id="market-synthesis"/);
  assert.match(index, /Official menu \+ photos/);
  assert.match(index, /Current performance and post-pilot target/);
  assert.match(index, /How the signals move together/);
  assert.match(index, /User settings/);
  assert.match(index, /Switch geography/);
  assert.match(index, /Competitor search scope/);
  assert.match(index, /decision-location-filter/);
  assert.match(index, /decision-type-filter/);
  assert.match(app, /AI sales synthesis/);
  assert.match(app, /AI review synthesis/);
  assert.match(app, /AI market synthesis/);
  assert.match(app, /function bundledAnswer/);
  assert.match(app, /retrieval: 'bundled'/);
  assert.match(app, /Sources loaded/);
  assert.match(app, /Rotisserie Ema sold 800\+ Greek froyos in four hours/);
  assert.match(app, /Back Bay action plan/);
  assert.match(app, /View strengths & gaps/);
  assert.match(data, /estimated weekly captured demand/);
  assert.match(data, /\/menu\/cold-brew\.jpg/);
  assert.match(data, /Pilot concept — not on the current menu/);
  assert.match(app, /function runPlaybook\(/);
  assert.match(app, /function askStoreline\(/);
  assert.match(app, /fetch\(['"]\/api\/ask['"]/);
  assert.match(app, /fetch\(['"]\/api\/status['"]/);
  assert.match(data, /reviewLocations:/);
  assert.match(data, /macroSignals:/);
  assert.match(data, /recommendations:/);
  assert.match(css, /\.assistant-layout/);
  assert.match(api, /x-storeline-tenant/);
  assert.match(api, /\/v1\/responses/);
  assert.match(api, /api\.anthropic\.com\/v1\/messages/);
  assert.match(api, /claude-sonnet-5/);
  assert.match(api, /deterministicCalculations/);
  assert.match(api, /evaluation_cases/);
  assert.equal(JSON.parse(hosting).d1, "DB");
  assert.doesNotMatch(`${index}\n${app}\n${data}`, /synthetic demo|demo data/i);
  assert.doesNotMatch(`${page}\n${index}\n${app}\n${data}\n${api}`, /kernel/i);
});

test("bundles the official menu photography used by the sales catalog", async () => {
  const assets = [
    "almond-croissant.jpg",
    "breakfast-sandwich.jpg",
    "cold-brew.jpg",
    "croissant-breakfast-sandwich.jpg",
    "farro-bowl.jpg",
    "lamb-meatball-shakshuka.png",
    "latte.jpg",
    "morning-bun.jpg",
    "muesli.jpg",
    "pistachio-latte.jpg",
    "pistachio-tart.jpg",
    "smoked-salmon-avocado-egg.jpg",
    "traditional-shakshuka.jpg",
  ];
  await Promise.all(assets.map((asset) => access(new URL(`../public/menu/${asset}`, import.meta.url))));
});
