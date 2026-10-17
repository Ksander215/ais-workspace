# AIS — Autonomous Intelligent System

> **AIS MVP is the active validation target.** This repository also contains the separate SIP Security Intelligence Platform. They are different product/runtime contours.

## AIS MVP — First User Quick Start

AIS is the experimental runtime for understanding an unfamiliar codebase through architecture-aware questions and evidence-backed answers.

### 1. Run AIS

Prerequisites: **Node.js 18+**, npm, and Git.

```bash
git clone https://github.com/Ksander215/sec-scanner-workspace.git
cd sec-scanner-workspace
npm install
npm run build

# Start the AIS MVP UI
npm run mvp-ui
# → http://localhost:3456
```

The AIS interface should open with **“AIS — Understand Any Codebase”**.

### 2. Enable real inference

The UI can start without a model key, but question answering requires real inference:

```bash
AIS_EXECUTION_REAL=true AIS_REAL_LLM=true OPENAI_API_KEY=YOUR_KEY npm run mvp-ui
```

If your OpenAI-compatible provider uses another endpoint, set `OPENAI_BASE_URL` as well:

```bash
AIS_EXECUTION_REAL=true AIS_REAL_LLM=true OPENAI_API_KEY=YOUR_KEY OPENAI_BASE_URL=YOUR_ENDPOINT npm run mvp-ui
```

**Do not commit API keys to the repository.**

### 3. First validation path

1. Open AIS at `http://localhost:3456`.
2. Choose **Demo** and ask: `What is the overall architecture of this project?`
3. Inspect the answer, claims, and source evidence.
4. Ask a second architecture question, then try a question of your own.
5. If validating continuity, stop and restart AIS, reopen the same project, and check the **Welcome Back** state.
6. For a real codebase, choose **GitHub Repository** and provide a public repository.

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
git clone https://github.com/Ksander215/sec-scanner-workspace.git
cd sec-scanner-workspace

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
sec-scanner-workspace/
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
├── docker/               # Dockerfiles and compose
├── scripts/              # Deploy, build, audit utilities
├── docs/                 # Documentation + brand book
├── ARCHITECTURE.md       # System architecture deep-dive
├── ROADMAP.md            # Development roadmap
├── CHANGELOG.md          # Release history
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

1. **[docs/HANDOFF.md](./docs/HANDOFF.md)** — Start here. Project overview, current state, next tasks.
2. **[docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md)** — Live status of every module and component.
3. **[docs/PRODUCT_PRINCIPLES.md](./docs/PRODUCT_PRINCIPLES.md)** — Product philosophy and non-negotiable rules.
4. **[docs/DEVELOPMENT_RULES.md](./docs/DEVELOPMENT_RULES.md)** — Mandatory development workflow and checks.
5. **[docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md)** — What must pass before any task is "done".

After reading these five documents, you can start development without needing any previous chat history.

---

## Documentation

### Core (read first)
| Document | Description |
|---|---|
| [docs/HANDOFF.md](./docs/HANDOFF.md) | **Start here** — project handoff, current state, next steps |
| [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) | Live status of every module, debts, risks |
| [docs/PRODUCT_VISION.md](./docs/PRODUCT_VISION.md) | Product vision and what we sell |
| [docs/PRODUCT_PRINCIPLES.md](./docs/PRODUCT_PRINCIPLES.md) | 11 non-negotiable product principles |
| [docs/DEVELOPMENT_RULES.md](./docs/DEVELOPMENT_RULES.md) | Mandatory development rules and workflow |
| [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md) | Release checklist — must pass before "done" |

### Specifications
| Document | Description |
|---|---|
| [docs/AIS_SPECIFICATION.md](./docs/AIS_SPECIFICATION.md) | Adaptive Intelligence System full spec |
| [docs/UX_GUIDELINES.md](./docs/UX_GUIDELINES.md) | UX guidelines, colors, typography, animations |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture and data flow |
| [docs/END_TO_END_CHECKLIST.md](./docs/END_TO_END_CHECKLIST.md) | E2E test scenarios for every page |

### Records
| Document | Description |
|---|---|
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Architecture Decision Records (ADR) |
| [docs/GLOSSARY.md](./docs/GLOSSARY.md) | Project glossary and terminology |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Development roadmap and priorities |
| [docs/CHANGELOG_PRODUCT.md](./docs/CHANGELOG_PRODUCT.md) | User-visible changes only |

### Technical
| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture deep-dive (root level) |
| [ROADMAP.md](./ROADMAP.md) | Strategic roadmap (root level) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](./SECURITY.md) | Security policy |
| [docs/api.md](./docs/api.md) | API reference |
| [docs/deployment.md](./docs/deployment.md) | Deployment guide |
| [docs/plugins.md](./docs/plugins.md) | Plugin development guide |

---

## License

MIT License — see [LICENSE](./LICENSE).

---

<div align="center">

**Built with purpose. Secured by design.**

[sec-scanner.pro](https://sec-scanner.pro) · [GitHub](https://github.com/Ksander215/sec-scanner-workspace)

</div>
