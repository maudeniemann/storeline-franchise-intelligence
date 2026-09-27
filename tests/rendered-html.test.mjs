import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("server-renders the Kernel application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Kernel — Franchise Intelligence<\/title>/i);
  assert.match(html, /<iframe[^>]+src="\/demo\/index\.html"/i);
  assert.match(html, /title="Kernel franchise intelligence"/i);
});

test("ships the six working product surfaces and grounded data layer", async () => {
  const [page, index, app, data, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/data.js", import.meta.url), "utf8"),
    readFile(new URL("../public/demo/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /src="\/demo\/index\.html"/);
  for (const view of ["today", "reviews", "pricing", "market", "next", "assistant"]) {
    assert.match(index, new RegExp(`data-view="${view}"`));
    assert.match(index, new RegExp(`id="${view}-template"`));
  }
  assert.match(index, /Ask anything\. Then turn the answer into work\./);
  assert.match(app, /function runPlaybook\(/);
  assert.match(app, /function askKernel\(/);
  assert.match(data, /reviewLocations:/);
  assert.match(data, /macroSignals:/);
  assert.match(data, /recommendations:/);
  assert.match(css, /\.assistant-layout/);
  assert.doesNotMatch(`${index}\n${app}\n${data}`, /synthetic demo|demo data/i);
});
