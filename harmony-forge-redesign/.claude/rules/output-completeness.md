# Output Completeness Rules

Source: `references/taste-skill/output-skill/SKILL.md`
Applies to: every code delivery turn (Phase 2+)

## Core Principle

A partial output is a broken output. Do not optimize for brevity — optimize for completeness.

## Banned Patterns (Hard Failures)

**In code blocks:**
`// ...`, `// rest of code`, `// implement here`, `// TODO`, `/* ... */`,
`// similar to above`, `// continue pattern`, `// add more as needed`, bare `...` standing in for omitted code

**In prose:**
"Let me know if you want me to continue", "for brevity", "the rest follows the same pattern",
"similarly for the remaining", "and so on" (when replacing actual content), "I'll leave that as an exercise"

**Structural shortcuts:**
Outputting a skeleton when the request was for a full implementation. Showing the first and last section while skipping the middle. Describing what code should do instead of writing it.

## Execution Process (Every Code Delivery)

1. **Scope** — Read the full request. Count distinct deliverables (files, components, hooks, sections). Lock that number.
2. **Build** — Generate every deliverable completely. No partial drafts, no "you can extend this later."
3. **Cross-check** — Before responding, compare deliverable count against scope count. If anything is missing, add it.

## Handling Token Limits

Do not compress remaining sections to squeeze them in. Do not skip ahead to a conclusion.
Write at full quality to a clean breakpoint (end of function, file, or section), then emit:

```
[PAUSED — X of Y complete. Send "continue" to resume from: <next section name>]
```

On "continue": pick up exactly where stopped. No recap, no repetition.

## Quick Check (Before Every Code Reply)

- No banned patterns appear anywhere in the output
- Every item the user requested is present and finished
- Code blocks contain runnable code, not descriptions of what code would do
- Nothing was shortened to save space
