#!/usr/bin/env python3
"""
auto_search.py — HarmonyForge ui-ux-pro-max auto-dispatcher
Runs as a UserPromptSubmit hook. Reads the user prompt from stdin (Claude Code
hook JSON payload), maps it to the most relevant skill domain, and surfaces
top-3 results as labelled suggestions.

Output is injected into Claude's context automatically via the hook system.
Fails silently on any error — never blocks the user's prompt.
"""

import sys
import json
import subprocess
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SEARCH_SCRIPT = os.path.join(SCRIPT_DIR, "search.py")
PYTHON = sys.executable

# Keyword → domain priority map (higher weight = stronger signal)
DOMAIN_MAP = {
    "ux": [
        "accessibility", "keyboard", "focus", "aria", "screen reader",
        "touch", "hover", "tooltip", "animation", "interaction", "tab",
        "focus ring", "drag", "drop", "gesture", "pour",
    ],
    "react": [
        "component", "hook", "useeffect", "usestate", "ref", "memo",
        "render", "performance", "zustand", "resize", "observer",
        "vexflow", "canvas", "effect", "store",
    ],
    "web": [
        "layout", "responsive", "scroll", "grid", "flex", "dom",
        "svg", "split pane", "sidebar", "dock", "toolbar", "panel",
        "breakpoint", "overflow", "position", "fixed", "sticky",
    ],
    "style": [
        "style", "theme", "dark mode", "light mode", "nocturne", "sonata",
        "color", "palette", "gradient", "shadow", "glassmorphism",
        "brutalism", "minimalism", "visual", "aesthetic",
    ],
}

# Domains that carry token risk — output gets the suggestion label
LABELLED_DOMAINS = {"style", "color", "typography"}


def extract_prompt(stdin_bytes: bytes) -> str:
    """Try to parse Claude Code hook JSON payload; fall back to raw text."""
    text = stdin_bytes.decode("utf-8", errors="replace").strip()
    if not text:
        return ""
    try:
        payload = json.loads(text)
        # Claude Code hook payload shapes:
        return (
            payload.get("prompt")
            or payload.get("message")
            or payload.get("content")
            or ""
        )
    except json.JSONDecodeError:
        return text  # raw prompt fallback


def best_domain(prompt: str) -> tuple[str, int]:
    lower = prompt.lower()
    scores: dict[str, int] = {}
    for domain, keywords in DOMAIN_MAP.items():
        scores[domain] = sum(1 for kw in keywords if kw in lower)
    best = max(scores, key=lambda d: scores[d])
    return best, scores[best]


def run_search(query: str, domain: str, n: int = 3) -> str:
    try:
        result = subprocess.run(
            [PYTHON, SEARCH_SCRIPT, query, "--domain", domain, "-n", str(n)],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=os.path.dirname(SCRIPT_DIR),  # project root
        )
        return result.stdout.strip()
    except Exception:
        return ""


def main() -> None:
    raw = sys.stdin.buffer.read()
    prompt = extract_prompt(raw)

    if not prompt:
        return

    # Truncate query to first 80 chars for cleaner search signal
    query = re.sub(r"\s+", " ", prompt[:80]).strip()
    domain, score = best_domain(prompt)

    # Skip if no meaningful keyword signal — avoid noise on non-design prompts
    if score == 0:
        domain = "ux"  # always safe fallback

    output = run_search(query, domain)
    if not output:
        return

    label = "[ui-ux-pro-max suggestion]" if domain in LABELLED_DOMAINS else "[ui-ux-pro-max]"
    header = f"\n{label} Auto-scan → domain: {domain} | query: \"{query[:50]}\"\n"
    # Limit total output to keep context clean
    print(header + output[:1200])


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # always silent failure
