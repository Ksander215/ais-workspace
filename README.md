# AIS — Autonomous Intelligent System

> **This repository contains AIS only.** The former SIP contour (Security Intelligence Platform) has been removed from `main` so it cannot interfere with AIS runtime, tests, discovery or CI.

<p align="center">
  <a href="#-ais--the-main-project"><b>🧠 AIS — the main project</b></a> ·
  <a href="https://ais-workspace.spru.site/"><b>▶ AIS demo</b></a> ·
  <a href="https://t.me/zarabotok_pulse_bot"><b>✈️ Telegram-канал</b></a> ·
  <a href="./docs/launch/"><b>📣 Launch plan</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AIS-AI%20architecture%20copilot-7C3AED" alt="AIS" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
  <img src="https://img.shields.io/github/stars/Ksander215/ais-workspace?style=social" alt="Stars" />
</p>

## 🧠 AIS — the main project

**AIS is the project being built and shipped here right now.** It is an AI copilot that reads an unfamiliar codebase and answers architecture questions with evidence behind every claim. AIS stays MIT and free, and its development happens in the open in this repository.

The former SIP (Security Intelligence Platform) code was removed from this repository. The commercial product built on that contour, **Sec Scanner**, lives in its own repository ([Ksander215/a-panel-store](https://github.com/Ksander215/a-panel-store)) — managed scanning, a hosted dashboard and hands-on onboarding. AIS itself stays free and MIT for everyone.

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

**Important:** use the root commands above. There is no separate SIP application in this repository anymore.

### 4. Windows quick start

The normal build/start commands above work in PowerShell, Command Prompu; and other shells:

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

### Repository scope

This repository contains **AIS only**. The former SIP (Security Intelligence Platform) contour — the
Next.js landing, the Express scanner backend, the scanner plugin manifests and the Docker stack — has
been removed from `main` so that it can no longer interfere with AIS runtime, tests, discovery or CI.

Sec Scanner (the commercial product built on that contour) lives in its own repository
([Ksander215/a-panel-store](https://github.com/Ksander215/a-panel-store)) and is not affected by this change.

---

## Roadmap

| Stage | Focus | Status |
|---|---|---|
| v0.1 | AIS execution engine, evidence loop, interaction layer | ✅ Shipped |
| v0.2 | MVP UI — import a repository, ask architecture questions, see sources | ✅ Shipped |
| v0.3 | Platform-aware path security, pinned-commit import | ✅ Shipped |
| v0.4 | Honest claim semantics: fact vs inference vs unknown | ✅ Shipped |
| v0.5 | Polygon external validation on real open-source repositories | 🔄 In progress |

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

### Technical
| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture deep-dive (root level) |
| [ROADMAP.md](./ROADMAP.md) | Roadmap (root level) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](./SECURITY.md) | Security policy |

---

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
