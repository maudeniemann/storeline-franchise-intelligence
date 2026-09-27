# Storeline

Storeline turns sales, customer reviews, and market context into operating decisions for multi-location hospitality groups.

**Live demo:** [storeline-franchise-intelligence.vercel.app](https://storeline-franchise-intelligence.vercel.app/)

![Storeline — operational intelligence for hospitality groups](public/og.png)

## The problem

Franchise owners and regional hospitality operators have the information they need, but it is split across POS reports, public reviews, market research, and competitor activity. Teams spend hours reconciling those signals and still struggle to decide what to change at a specific location.

Storeline gives the operator one evidence-linked view of what happened, why it matters, and what to do next.

## Customer and business case

The primary user is a franchise owner, regional operator, or operations lead responsible for multiple café or restaurant locations. The buyer is the hospitality group or franchise organization.

They would pay for Storeline to replace recurring manual analysis, surface revenue and service risks earlier, and turn promising ideas into measurable location-level tests. It makes weekly operating reviews faster and makes each recommendation traceable to sales, customer, and market evidence.

## How it works

- **Today:** a prioritized operating brief across locations
- **Reviews:** location-level comments, themes, and AI synthesis
- **Sales:** product mix, menu photography, modeled unit economics, and AI synthesis
- **Market:** macro signals, competitor evidence, and AI synthesis
- **Next steps:** evidence-linked decisions and executable playbooks
- **Workspace:** launch packages, AI-generated campaign creative, approvals, store checklists, and pilot scorecards
- **Ask Storeline:** retrieval over the connected evidence layer, with optional OpenAI or Anthropic generation

## Operational fit

Storeline sits above the tools an operator already uses. POS transactions supply product and location performance; public reviews supply customer language and recurring service themes; market and competitor sources supply external context. The owner receives a daily brief, explores the evidence by tab, approves a recommended action, and tracks the resulting pilot in the Workspace.

The live demo follows one complete workflow: identify Greek-froyo demand, connect it to sales and review signals, generate a campaign and operating plan, and approve the launch.

## Where AI matters

AI retrieves evidence across the three data layers, synthesizes cross-source patterns, answers natural-language questions with supporting context, and turns a recommendation into an executable launch package. The package includes the offer, campaign creative, operating checklist, and pilot scorecard. Rules and dashboards alone can display the inputs; the model is what connects them into a grounded decision and creates the follow-through artifacts.

## What is real and what is modeled

- **Real:** the working seven-tab product, public deployment, source-linked market research, supplied public-review excerpts, menu imagery, evidence navigation, approval interactions, and generated campaign creative.
- **Modeled:** POS transaction volumes, unit margins, and forecast impact are curated scenario data because private restaurant sales data was not available during the build.
- **Represented integration:** the approval flow demonstrates the handoff to Instagram; it does not publish to a live brand account.
- **Model runtime:** the repository includes OpenAI and Anthropic routing. Without a provider key, the public build uses deterministic grounded responses so the demo remains reliable.

Storeline is an independent prototype and is not affiliated with Tatte Bakery & Café.

## Prior work

None. Storeline was built during Test Flight 2026 using public libraries, models, and APIs.

## Architecture

- React 19 and TypeScript
- vinext / Cloudflare Workers runtime
- Cloudflare D1 with Drizzle ORM
- Static Vercel demo build
- Optional OpenAI or Anthropic API connection
- Deterministic bundled answers when no model key is configured

## Run locally

Node.js 22.13 or newer is required.

```bash
npm install
npm run dev
```

Then open the local URL printed by vinext.

## Verify

```bash
npm run lint
npm test
```

## Optional model connection

The application works without an external model key. To enable generated answers, configure one of these variables in the deployment environment:

```bash
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=...
```

or:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

Never commit environment files or API keys. The repository ignores `.env*` files.

## Project structure

```text
app/                 Application shell and metadata
public/demo/         Interactive Storeline interface
public/brand/        Logo, favicon, and web manifest
public/campaign/     Generated campaign creative used by the marketing agent
public/menu/         Menu photography used by the sales catalog
worker/              Evidence retrieval, model routing, and API endpoints
db/ and drizzle/     D1 schema and migrations
tests/               Rendered-output and asset verification
```
