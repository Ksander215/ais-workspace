#!/usr/bin/env python3
"""Restore README.md from the pristine launch commit and re-apply the commercial blocks.

The README on main was hand-edited and picked up unintended changes (renamed env
vars, broken CHANGELOG link, mangled ASCII art). This script rebuilds the file
from the pristine commit and adds only the two intended sections.
"""

import subprocess
import sys

PRISTINE = "0be91f01d7aaab4aff30c90f9b8d5fb507e4a9c4"
PATH = "README.md"

HERO = """<p align="center">
  <a href="#-ais--the-main-project"><b>🧠 AIS — the main project</b></a> ·
  <a href="#-commercial-sec-scanner"><b>💰 Sec Scanner (commercial)</b></a> ·
  <a href="https://sec-scanner.pro"><b>▶ Live demo</b></a> ·
  <a href="https://t.me/zarabotok_pulse_bot"><b>✈️ Telegram-канал</b></a> ·
  <a href="./docs/launch/"><b>📣 Launch plan</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AIS-AI%20architecture%20copilot-7C3AED" alt="AIS" />
  <img src="https://img.shields.io/badge/SIP-security%20platform-06B6D4" alt="SIP" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
  <img src="https://img.shields.io/github/stars/Ksander215/sec-scanner-workspace?style=social" alt="Stars" />
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
"""

SUPPORT = """## ⭐ Support the project

This repository is MIT and stays free, and AIS keeps shipping free. The fastest way to support the work is to **use Sec Scanner** — every subscription funds development of the open source here.

- Sec Scanner store: [lead.sec-scanner.pro](https://lead.sec-scanner.pro)
- Managed platform: [sec-scanner.pro](https://sec-scanner.pro)
- Telegram: [@zarabotok_pulse_bot](https://t.me/zarabotok_pulse_bot)

If you'd rather sponsor directly, use the **Sponsor** button on the repository page.

### Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/REPOSITORY_GOVERNANCE.md](./docs/REPOSITORY_GOVERNANCE.md). Work that touches the AIS contour must state so explicitly; the release gate is described in [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md).
"""

ANCHOR = (
    "> **AIS is the main product in this repository.** SIP was the original "
    "project and now lives as an auxiliary product inside AIS. They are "
    "different product/runtime contours.\n"
)

REPLACEMENTS = [
    (
        "> **AIS MVP is the active validation target.** This repository also contains "
        "the separate SIP Security Intelligence Platform. They are different "
        "product/runtime contours.",
        "> **AIS is the main product in this repository.** SIP was the original "
        "project and now lives as an auxiliary product inside AIS. They are "
        "different product/runtime contours.",
    ),
    (
        "the `landing/` directory belongs to the separate SIP application.",
        "the `landing/` directory belongs to the SIP application, which is an "
        "auxiliary product inside AIS.",
    ),
]
LICENSE_ANCHOR = "---\n\n## License"


def main() -> int:
    subprocess.run(["git", "checkout", PRISTINE, "--", PATH], check=True)
    text = open(PATH, encoding="utf-8").read()

    for old, new in REPLACEMENTS:
        if old in text:
            text = text.replace(old, new, 1)

    if ANCHOR not in text:
        print("hero anchor not found", file=sys.stderr)
        return 1
    if LICENSE_ANCHOR not in text:
        print("license anchor not found", file=sys.stderr)
        return 1

    if "## 🧠 AIS — the main project" not in text:
        text = text.replace(ANCHOR, ANCHOR + "\n" + HERO, 1)
    if "## ⭐ Support the project" not in text:
        text = text.replace(LICENSE_ANCHOR, SUPPORT + "\n" + LICENSE_ANCHOR, 1)

    open(PATH, "w", encoding="utf-8").write(text)
    print("README restored")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
