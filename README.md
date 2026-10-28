# AIS — Autonomous Intelligent System

> **AIS is the main product in this repository.** SIP was the original project and now lives as an auxiliary product inside AIS. They are different product/runtime contours.

<p align="center">
  <a href="#-ais--the-main-project"><b>🧠 AIS — the main project</b></a> ·
  <a href="#-commercial-sec-scanner"><b>💰 Sec Scanner (commercial)</b></a> ·
  <a href="https://ais-workspace.spru.site/"><b>▶ AIS demo</b></a> ·
  <a href="https://t.me/zarabotok_pulse_bot"><b>✈️ Telegram-канал</b></a> ·
  <a href="./docs/launch/"><b>📣 Launch plan</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AIS-AI%20architecture%20copilot-7C3AED" alt="AIS" />
  <img src="https://img.shields.io/badge/SIP-security%20platform-06B6D4" alt="SIP" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
  <img src="https://img.shields.io/github/stars/Ksander215/ais-workspace?style=social" alt="Stars" />
</p>

## 🧠 AIS — the main project

**AIS is the project being built and shipped here right now.** It is an AI copilot that reads an unfamiliar codebase and answers architecture questions with evidence behind every claim. AIS stays MIT and free, and its development happens in the open in this repository.

SIP (Security Intelligence Platform) was the original project. It now lives inside AIS as an auxiliary product, and its scanning stack ships commercially as **Sec Scanner**.

## 💰 Commercial: Sec Scanner

**Sec Scanner** is the paid build of the auxiliary **SIP** product inside AIS — managed scanning, a hosted dashboard and hands-on onboarding. AIS itself stays free and MIT for everyone.

| Plan | Price | What you get |
|---|---|---|
| Free | 0 ₽ | Sec Scanner demo, 3 scans/month, public repos |
| Basic | 299 ₽ / mo | 10 scans, Nuclei + ZAP + semgrep, PDF reports |
| Pro | 799 ₽ / mo | 50 scans, Knowledge Graph, attack paths, API keys |
| Business | 2 499 ₽ / mo | Unlimited, CI/CD webhooks, team & RBAC, priority support |

- Live store: **[lead.sec-scanner.pro](https://lead.sec-scanner.pro)** (Telegram Mini App, card + Telegram Stars)
- Managed platform: **[sec-scanner.pro](https://sec-scanner.pro)**
- Source of the store UI: **[a-panel-store](https://github.com/Ksander215/a-panel-store)**

Using AIS/SIP in a paid workflow? Say so in an issue — paid support and custom integrations are available.

## AIS MVP — First User Quick Start

AIS is the experimental runtime for understanding an unfamiliar codebase through architecture-aware questions and evidence-backed answers.

### 1. Prerequisites

Install these before cloning the repository:

- **Node.js 18+** (Node.js 20 LTS is recommended)
- **npm** (included with Node.js)
- **Git**

Verify:

```text
node --version
npm --version
git --version
```

### 2. Clone and build AIS

Run these commands from the repository root:

```bash
git clone https://github.com/Ksander215/ais-workspace.git
cd ais-workspace
npm install
npm run build
```

The build must complete successfully before starting the UI.

### 3. Start the AIS UI

```bash
npm run mvp-ui
```

Open:

```text
http://localhost:3456
```

The interface should show **“AIS — Understand Any Codebase”**.

**Important:** do not use `cd landing && npm run dev` for AIS. The `landing/` directory belongs to the separate SIP application.

### 4. Windows quick start

The normal build/start commands above work in PowerShell, Command Prompt, and other shells:

```text
cd ais-workspace
npm install
npm run build
npm run mvp-ui
```

If PowerShell reports that `npm` or `node` is not recognized, install/reinstall Node.js and open a new terminal.

### 5. Enable real inference (optional)

AIS can start without a model key. Real question answering requires:

- `AIS_EXECUTION_REAL=true`
- `AIS_REAL_LLM=true`
- `OPENAI_API_KEY`

Do **not** put the key into source files or commit it to Git.

#### PowerShell

```powershell
$env:AIS_EXECUTION_REAL="true"
$env:AIS_REAL_LLM="true"
$env:OPENAI_API_KEY="YOUR_KEY"
npm run mvp-ui
```

For an OpenAI-compatible provider:

```powershell
$env:OPENAI_BASE_URL="YOUR_ENDPOINT"
npm run mvp-ui
```

#### Windows Command Prompt

```cmd
set AIS_EXECUTION_REAL=true
set AIS_REAL_LLM=true
set OPENAI_API_KEY=YOUR_KEY
npm run mvp-ui
```

For an OpenAI-compatible provider:

```cmd
set OPENAI_BASE_URL=YOUR_ENDPOINT
npm run mvp-ui
```

#### Linux / macOS

```bash
AIS_EXECUTION_REAL=true AIS_REAL_LLM=true OPENAI_API_KEY=YOUR_KEY npm run mvp-ui
```

### 6. First-user validation

After the UI opens:

1. Choose **Demo**.
2. Ask: `What is the overall architecture of this project?`
3. Inspect the answer, claims, and source evidence.
4. Ask another architecture question.
5. Try a question of your own.
6. For continuity validation, stop AIS, run `npm run mvp-ui` again, reopen the same project, and check **Welcome Back**.
7. To analyze another public codebase, choose **GitHub Repository** and provide its public GitHub URL.

### 7. Troubleshooting

**`npm` or `node` is not recognized**

Install Node.js 18+ and restart the terminal.

**`git` is not recognized**

Install Git and restart the terminal.

**Port 3456 is already in use**

Start AIS on another port:

PowerShell:
```powershell
$env:MVP_UI_PORT="3457"
npm run mvp-ui
```

Command Prompt:
```cmd
set MVP_UI_PORT=3457
npm run mvp-ui
```

Then open `http://localhost:3457`.

**AIS opens, but questions return that real inference is unavailable**

The UI can start without a model key. Check that `AIS_EXECUTION_REAL`, `AIS_REAL_LLM`, and `OPENAI_API_KEY` are set in the same terminal session that starts AIS. If using another OpenAI-compatible provider, also set `OPENAI_BASE_URL`.

**GitHub Repository cannot be resolved**

The current MVP supports public GitHub repositories only. The machine must have Git and network access to GitHub.

### AIS vs SIP

**Use the root commands above for AIS.**

The `landing/`, `backend/`, and `plugins/` directories contain the separate **SIP — Security Intelligence Platform** application. The SIP demo is not the AIS MVP and should not be used as the AIS validation entry point.

---

<div align="center">

# SIP

### Security Intelligence Platform

**Unified Security Platform for Business Infrastructure**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

[Live Demo](https://sec-scanner.pro) · [Documentation](./docs/) · [Architecture](./ARCHITECTURE.md) · [Roadmap](./ROADMAP.md)

</div>

---

## What SIP Does

SIP is an open-source security operations platform that consolidates vulnerability assessment, infrastructure analysis, risk quantification, and AI-driven recommendations into a single system. Instead of juggling ten disconnected tools, security teams get one dashboard that shows what matters, why it matters, and exactly what to do next.

**Core Capabilities:**

| Capability | Description |
|---|---|
| Vulnerability Assessment | Automated scanning with nmap, nuclei, ZAP, semgrep, trivy, nikto |
| DAST | Dynamic Application Security Testing through integrated proxy engine |
| Repository Security | Scan source code for secrets, misconfigurations, and dependency risks |
| Infrastructure Security | Network topology analysis with Knowledge Graph visualization |
| Knowledge Graph | Interactive graph mapping relationships between assets and vulnerabilities |
| Attack Paths | Visualize exploitation chains from entry point to critical asset |
| Reports | Business-oriented reports in PDF, JSON, and dashboard formats |
| Marketplace | Extensible plugin system with community and custom scanners |
| Integrations | SSH, API keys, CI/CD webhooks, and third-party tool connectors |

---

## Screenshots

| | | |
|:---:|:---:|:---:|
| **Hero / Landing** | **Dashboard** | **Scanner** |
| *First impression — value proposition and call to action* | *Real-time security posture overview with critical metrics* | *Step-by-step scan wizard with plugin selection and live results* |
| **Marketplace** | **Reports** | **Knowledge Graph** |
| *Browse and install scanner plugins, dashboards, and templates* | *Business-focused findings with risk scores and remediation* | *Interactive graph of infrastructure nodes and vulnerability edges* |
| **Attack Paths** | | |
| *Visual chain from external attacker to internal critical asset* | | |

> All screenshots are from the live deployment at [sec-scanner.pro](https://sec-scanner.pro)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        SIP Platform                               │
├────────────────┬────────────────┬────────────────────────────────┤
│   Landing      │   Frontend     │         Backend                │
│   (Next.js)    │   (React)      │     (Express + TypeScript)     │
│                │                │                                │
│  Marketing     │  Dashboard     │  API Server                    │
│  Pricing       │  Scanner       │  Plugin Runtime                │
│  Documentation │  Reports       │  Knowledge Graph Engine        │
│                │  Marketplace   │  Attack Path Engine            │
│                │  Integrations  │  AI Recommendations            │
├────────────────┴────────────────┴────────────────────────────────┤
│                      Plugin System                                │
│  nmap · nuclei · zap · semgrep · trivy · nikto                   │
├──────────────────────────────────────────────────────────────────┤
│                     Shared Packages                               │
│  @sip/types · @sip/sdk · @sip/ui · @sip/shared                  │
├──────────────────────────────────────────────────────────────────┤
│                     Parser Engine                                 │
│  JSON · XML · SARIF · Custom regex-based extractors              │
├──────────────────────────────────────────────────────────────────┤
│                     AI Engine                                     │
│  Risk scoring · Prioritization · Natural-language explanations    │
└──────────────────────────────────────────────────────────────────┘
```

### Frontend Stack

- **Next.js 16** with Turbopack and static export
- **React 19** with Server Components
- **Tailwind CSS 4** with custom design tokens
- **Framer Motion** for interactive animations
- **TypeScript 5** strict mode
- **i18n** — Russian + English with context-aware translations

### Backend Stack

- **Express.js** REST API server
- **Plugin Runtime** — dynamic loading and execution of scanner plugins
- **Knowledge Graph** — auto-constructed from scan results
- **Attack Path Engine** — multi-hop exploitation chain analysis
- **AI Recommendations** — context-aware remediation priorities

### Plugin Runtime

Each plugin runs in isolation with a defined manifest:

```json
{
  "id": "nmap",
  "name": "Nmap Network Scanner",
  "version": "1.0.0",
  "type": "network",
  "binary": "nmap",
  "args": "-sV -sC -oX {output}",
  "parser": "xml"
}
```

---

## SIP Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Clone and Run (SIP)

```bash
git clone https://github.com/Ksander215/ais-workspace.git
cd ais-workspace

# Frontend
cd landing
npm install
npm run dev
# → http://localhost:3000

# Backend (optional)
cd ../backend
npm install
npm run build
npm start
# → http://localhost:3001
```

### Docker

```bash
docker compose up -d
```

### Production Build

```bash
cd landing
npm install
npm run build
# Static export lands in landing/out/
# Deploy the out/ directory to any static host (nginx, S3, Cloudflare Pages)
```

---

## Project Structure

```
ais-workspace/
├── landing/              # Next.js frontend (static export)
│   ├── src/
│   │   ├── app/          # 63 pages — dashboard, scanner, marketplace, reports...
│   │   ├── components/   # UI components, layouts, sections
│   │   └── lib/          # Engine, i18n, API client, demo data
│   ├── public/           # Static assets
│   └── out/              # Production build output
├── backend/              # Express API server
│   └── src/
│       ├── routes/       # REST endpoints
│       ├── services/     # Scanner, KG, attack paths, reports
│       ├── plugins/      # Plugin runtime + manifests
│       └── parsers/      # Output format parsers
├── plugins/              # Scanner plugin definitions
│   ├── nmap/
│   ├── nuclei/
│   ├── zap/
│   ├── semgrep/
│   ├── trivy/
│   └── nikto/
├── packages/             # Shared packages
│   ├── types/            # @sip/types
│   ├── sdk/              # @sip/sdk
│   ├── ui/               # @sip/ui
│   └── shared/           # @sip/shared
├── docker/               # Dockerfiles, compose
├── scripts/              # Deploy, build, audit utilities
├── docs/                 # Documentation + brand book
├── ARCHITECTURE.md       # System architecture deep-dive
├── ROADMAP.md            # Roadmap
├── CHANGELOG.md          # Version history
└── CONTRIBUTING.md       # Contribution guidelines
```

---

## Roadmap

| Version | Focus | Status |
|---|---|---|
| v0.1 | Landing + Dashboard + Basic Scanner | ✅ Shipped |
| v0.2 | Plugin System + Marketplace | ✅ Shipped |
| v0.3 | Knowledge Graph + Attack Paths | ✅ Shipped |
| v0.4 | AI Recommendations + Business Reports | ✅ Shipped |
| v0.5 | CI/CD Integration + API Keys | ✅ Shipped |
| v0.6 | Team Collaboration + RBAC | 🔜 Planned |
| v0.7 | Compliance Frameworks (ISO 27001, SOC 2) | 🔜 Planned |
| v0.8 | Custom Dashboards + Widget Builder | 🔜 Planned |

Full roadmap: [ROADMAP.md](./ROADMAP.md)

---

## For New Developers

If you're joining the project for the first time, read the documentation in this order:

1. **[docs/product/mvp-definition.md](./docs/product/mvp-definition.md)** — Start here. Project overview, current state, next tasks.
2. **[docs/product/audits/ais-repository-audit.md](./docs/product/audits/ais-repository-audit.md)** — Live status of every module and component.
3. **[docs/product/product-principles.md](./docs/product/product-principles.md)** — Product philosophy and non-negotiable rules.
4. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Mandatory development workflow and checks.
5. **[docs/product/validation/reports/mvp-free-release-readiness-001.md](./docs/product/validation/reports/mvp-free-release-readiness-001.md)** — What must pass before any task is "done".

After reading these five documents, you can start development without needing any previous chat history.

---

## Documentation

### Core (read first)
| Document | Description |
|---|---|
| [docs/product/mvp-definition.md](./docs/product/mvp-definition.md) | **Start here** — project handoff, current state, next steps |
| [docs/product/audits/ais-repository-audit.md](./docs/product/audits/ais-repository-audit.md) | Live status of every module, debts, risks |
| [docs/product/product-vision.md](./docs/product/product-vision.md) | Product vision and what we sell |
| [docs/product/product-principles.md](./docs/product/product-principles.md) | 11 non-negotiable product principles |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Mandatory development rules and workflow |
| [docs/product/validation/reports/mvp-free-release-readiness-001.md](./docs/product/validation/reports/mvp-free-release-readiness-001.md) | Release checklist — must pass before "done" |

### Specifications
| Document | Description |
|---|---|
| [SRC-001.000.md](./SRC-001.000.md) | Adaptive Intelligence System full spec |
| [docs/product/validation/reports/ux-contract-findings-001.md](./docs/product/validation/reports/ux-contract-findings-001.md) | UX guidelines, colors, typography, animations |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and data flow |
| [docs/product/validation/reports/mvp-free-real-e2e-001.md](./docs/product/validation/reports/mvp-free-real-e2e-001.md) | E2E test scenarios for every page |

### Records
| Document | Description |
|---|---|
| [docs/product/product-architecture-decisions.md](./docs/product/product-architecture-decisions.md) | Architecture Decision Records (ADR) |
| [docs/product/capability-map.md](./docs/product/capability-map.md) | Capability map and terminology |
| [docs/product/product-roadmap.md](./docs/product/product-roadmap.md) | Strategic roadmap (roadmap) |
| [landing/CHANGELOG_PRODUCT.md](./landing/CHANGELOG_PRODUCT.md) | User-visible changes only |

### Technical

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture deep-dive (root level) |
| [ROADMAP.md](./ROADMAP.md) | Strategic roadmap (root level) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](./SECURITY.md) | Security policy |
| [backend/src/index.ts](./backend/src/index.ts) | API entry point and routes |
| [docker/docker-compose.yml](./docker/docker-compose.yml) | Deployment guide |
| [backend/src/plugins/manifests.ts](./backend/src/plugins/manifests.ts) | Plugin manifests (source of truth) |

## ⭐ Support the project

This repository is MIT and stays free, and AIS keeps shipping free. The fastest way to support the work is to **use Sec Scanner** — every subscription funds development of the open source here.

- Sec Scanner store: [lead.sec-scanner.pro](https://lead.sec-scanner.pro)
- Managed platform: [sec-scanner.pro](https://sec-scanner.pro)
- Telegram: [@zarabotok_pulse_bot](https://t.me/zarabotok_pulse_bot)

The **Sponsor** button on the repository page opens the Sec Scanner store. To be plain about it: that is a purchase, not a donation — there is no separate donation channel, and every payment goes straight to running the paid platform.

### Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/REPOSITORY_GOVERNANCE.md](./docs/REPOSITORY_GOVERNANCE.md). Work that touches the AIS contour must state so explicitly; the release gate is described in [docs/RELEASE_CHECKLIST.md](./docs/product/validation/reports/mvp-free-release-readiness-001.md).

---

## License

MIT License — see [LICENSE](./LICENSE).

---

<div align="center">

**Built with purpose. Secured by design.**

[sec-scanner.pro](https://sec-scanner.pro) · [GitHub](https://github.com/Ksander215/ais-workspace)

</div>
