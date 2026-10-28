# AIS — Autonomous Intelligent System

> **This repository contains AIS only.** The former SIP contour (Security Intelligence Platform) has been removed from `main` so it cannot interfere with AIS runtime, tests, discovery or CI.

<p align="center">
  <a href="#-ais--the-main-project"><b>🧠 AIS — the main project</b></a> ·
  <a href="https://ais-workspace.spru.site/"><b>▶ AIS demo</b></a> ·
  <a href="https://ais-demo.spru.run/"><b>▶ Live demo</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AIS-AI%20architecture%20copilot-7C3AED" alt="AIS" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
  <img src="https://img.shields.io/github/stars/Ksander215/ais-workspace?style=social" alt="Stars" />
</p>

## 🧠 AIS — the main project

**AIS is the project being built and shipped here right now.** It is an AI copilot that reads an unfamiliar codebase and answers architecture questions with evidence behind every claim. AIS stays MIT and free, and its development happens in the open in this repository.

## 💼 Commercial: Sec Scanner

The former SIP (Security Intelligence Platform) code was removed from this repository. The commercial product built on that contour, **Sec Scanner**, lives in its own repository ([Ksander215/a-panel-store](https://github.com/Ksander215/a-panel-store)) — managed scanning, a hosted dashboard and hands-on onboarding. AIS itself stays free and MIT for everyone.

## Quick start

```bash
npm install
npm run build
npm test
npm run mvp-ui
```

The MVP UI serves on `http://localhost:3456` by default.

**Important:** use the root commands above. There is no separate SIP application in this repository anymore.

## Repository scope

This repository contains **AIS only**. The former SIP (Security Intelligence Platform) contour — the
Next.js landing, the Express scanner backend, the scanner plugin manifests and the Docker stack — has
been removed from `main` so that it cannot affect AIS runtime, tests, discovery or CI.

Sec Scanner (the commercial product built on that contour) lives in its own repository:
[Ksander215/a-panel-store](https://github.com/Ksander215/a-panel-store).

## ⭐ Support the project

This repository is MIT and stays free, and AIS keeps shipping free. The fastest way to support the work is to **use Sec Scanner** — every subscription funds development of the open source here.

- Sec Scanner store: [lead.sec-scanner.pro](https://lead.sec-scanner.pro)
- Managed platform: [sec-scanner.pro](https://sec-scanner.pro)
- Telegram: [@zarabotok_pulse_bot](https://t.me/zarabotok_pulse_bot)

The **Sponsor** button on the repository page opens the Sec Scanner store. To be plain about it: that is a purchase, not a donation — there is no separate donation channel, and every payment goes straight to running the paid platform.

### Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/REPOSITORY_GOVERNANCE.md](./docs/REPOSITORY_GOVERNANCE.md).

## License

MIT
