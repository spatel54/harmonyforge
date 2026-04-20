# Theory Inspector — Page-Specific Overrides

> Rules here override [`../MASTER.md`](../MASTER.md) for the Theory Inspector sidebar only.
> Any rule NOT listed here falls back to [`../MASTER.md`](../MASTER.md).

## Surface Identity
The Theory Inspector is the Glass Box explainability sidebar. It displays LLM-generated
violation explanations, severity labels, override toggles, and academic rule citations.
It consumes structured JSON from the backend API — it never computes theory logic itself.

## Layout Override
- Width: 30% at `lg`, 40% at `md`, full-width bottom drawer at `sm`.
- Internal padding: `spacing.global` (16px) on all sides.
- Scrollable independently from the Sandbox — `overflow-y: auto`, `h-full`.
- `TheoryExplanationCard` components stack vertically with `spacing.base` (8px) gap.

## Typography Override
- Violation descriptions use `font.serif` (Merriweather) at `14px / 400` — academic tone.
- Rule IDs (e.g., `RULE_PARALLEL_FIFTH`) use `font.mono` at `13px` in a metadata pill.
- Section headings within the Inspector use `font.sans` at `12px / 500` (Caption level),
  rendered in `theme.detail` color — subordinate to the Sandbox hierarchy.

## Color Override
- Card backgrounds: `theme.surface` with `radius.standard` (4px).
- Violation severity badge: `semantic.violation` (`#D32F2F`) on `#FFFFFF` text only.
- Warning severity badge: `semantic.warning` (`#1976D2`) on `#FFFFFF` text only.
- Override applied state: `semantic.override` (`#7B1FA2`) ring on the toggle.

## Interaction Override
- Override toggles: `transition-colors duration-200` only — no scale or translate.
- Expanding explanation text: `0ms` reveal (no slide or fade) to match Sandbox's
  zero-latency violation reveal rule.

## Accessibility Override
- Every `TheoryExplanationCard` must have `role="region"` with
  `aria-label="[RuleId] explanation"`.
- Override toggle must have `aria-pressed` reflecting current override state.
- Violation severity must be communicated via both color AND a text label
  (`"Violation"` / `"Warning"`) — never color alone.
