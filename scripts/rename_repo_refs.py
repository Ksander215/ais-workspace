#!/usr/bin/env python3
"""One-off migration: repository `sec-scanner-workspace` was renamed to `ais-workspace`.

Rewrites references to the old name across tracked text files and patches
`scripts/readme_restore.py`, which rebuilds README from a pristine commit and
would otherwise reintroduce the old name.

Skips:
  - the nested `sec-scanner-workspace` gitlink (separate working tree);
  - historical audit and validation reports (they record the name at a past commit);
  - this script itself (its constants must keep the old name to work);
  - workflow files (the CI token has no `workflows: write` permission);
  - binary and lock files.
"""

import os
import subprocess
import sys

OLD = "sec-scanner-workspace"
NEW = "ais-workspace"

SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", "coverage", OLD}
SKIP_PREFIXES = (
    "docs/product/audits/",
    "docs/product/validation/",
    "frames/",
    "public/",
    "assets/",
    ".github/workflows/",
)
TEXT_EXT = {
    ".md", ".ts", ".tsx", ".js", ".jsx", ".json", ".yml", ".yaml",
    ".html", ".css", ".txt", ".sh", ".py", ".toml", ".mjs", ".cjs",
}
RESTORE_SCRIPT = "scripts/readme_restore.py"


def tracked_files() -> list[str]:
    out = subprocess.run(
        ["git", "ls-files"], capture_output=True, text=True, check=True
    ).stdout.splitlines()
    return out


def patch_restore_script() -> bool:
    """Make the README restore script repo-name agnostic."""
    if not os.path.exists(RESTORE_SCRIPT):
        return False
    with open(RESTORE_SCRIPT, encoding="utf-8") as fh:
        text = fh.read()
    if "OLD_REPO_NAME" in text:
        return False
    if "    text = open(PATH, encoding=\"utf-8\").read()" not in text:
        return False
    # 1) Rewrite the old name inside the script (e.g. the star badge in HERO).
    text = text.replace(OLD, NEW)
    # 2) Add the name constants and apply them to the restored README.
    text = text.replace(
        '    text = open(PATH, encoding="utf-8").read()',
        '    text = open(PATH, encoding="utf-8").read()\n'
        '    text = text.replace(OLD_REPO_NAME, NEW_REPO_NAME)',
        1,
    )
    text = text.replace(
        'PRISTINE = "0be91f01d7aaab4aff30c90f9b8d5fb507e4a9c4"',
        'PRISTINE = "0be91f01d7aaab4aff30c90f9b8d5fb507e4a9c4"\n'
        'OLD_REPO_NAME = "sec-scanner-workspace"\n'
        'NEW_REPO_NAME = "ais-workspace"',
        1,
    )
    with open(RESTORE_SCRIPT, "w", encoding="utf-8") as fh:
        fh.write(text)
    return True


def main() -> int:
    changed: list[str] = []
    for path in tracked_files():
        if path.startswith(SKIP_PREFIXES) or path.startswith(OLD + "/"):
            continue
        if path == RESTORE_SCRIPT:
            continue
        if path == os.path.normpath(__file__):
            # never rewrite the migration script's own constants
            continue
        if os.path.splitext(path)[1].lower() not in TEXT_EXT:
            continue
        if any(part in SKIP_DIRS for part in path.split("/")):
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                text = fh.read()
        except (UnicodeDecodeError, FileNotFoundError):
            continue
        if OLD not in text:
            continue
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text.replace(OLD, NEW))
        changed.append(path)

    if patch_restore_script():
        changed.append(RESTORE_SCRIPT)

    # Regenerate README from the pristine commit so the clone instructions
    # and star badge carry the new name.
    subprocess.run(["python3", RESTORE_SCRIPT], check=False)
    if os.path.exists("README.md"):
        subprocess.run(["git", "add", "README.md"], check=False)
        changed.append("README.md")

    if not changed:
        print("nothing to rename")
        return 0

    # Stage only: the workflow performs the commit and push.
    subprocess.run(["git", "add", *changed], check=True)
    print(f"renamed in {len(changed)} files:")
    for p in changed:
        print(" ", p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
