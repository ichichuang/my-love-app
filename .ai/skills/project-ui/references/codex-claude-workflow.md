# Codex / Claude Workflow Reference

## Codex Responsibilities

Codex is the architecture-safe implementer:

- Read `.ai/skills/project-ui/SKILL.md` and the relevant checklists before any code change.
- Produce exact, minimal diffs.
- Maintain TypeScript correctness and strict-mode compatibility.
- Keep static scans passing.
- Preserve repository hygiene (no unrelated changes, no reformatting).
- Run the full validation suite after changes.
- Never use broad destructive commands (`git add .`, `git clean`, `git reset`, etc.).
- Never stage, commit, push, deploy, upload, preview unless explicitly instructed.
- Never inspect or print secrets.

## Claude Responsibilities

Claude is the visual-quality reviewer:

- Read `.ai/skills/project-ui/SKILL.md`, relevant checklists, `AGENTS.md`, `CLAUDE.md`, `docs/AI_CODING_GUIDELINES.md`, `docs/PRODUCT_REQUIREMENTS.zh-CN.md`, `src/pages.json`, `src/components/AppShell.vue`, `src/components/AppCustomNav.vue`, `src/composables/useCustomNavMetrics.ts`, `src/composables/useKeyboardAvoidance.ts`, `src/styles/mixins.scss`, `src/design-system/token-registry.ts`, and relevant pages/components before UI review.
- Focus on: visual refinement, screenshot-based UI review, copy nuance, spacing and composition critique, motion and interaction polish, user-facing quality.
- Must still obey all token, Wot UI, architecture, validation, and forbidden-action rules.
- Must not bypass the Skill or invent a separate visual system.
- When suggesting changes, reference the relevant Skill section and checklist.

## Collaboration Model

1. User request arrives.
2. The active agent reads the Skill and checklists.
3. If the request is primarily implementation: Codex executes and validates.
4. If the request is primarily visual review: Claude inspects and critiques, then Codex applies agreed changes if code edits are needed.
5. Both agents ensure the final state passes `pnpm scan:project-ui` and the rest of the validation suite.

## Handoff Notes

- When Codex finishes implementation, the summary should cite which Skill sections and checklists were applied.
- When Claude finishes review, the summary should cite visual concerns, copy suggestions, and whether the change respects the Skill.
- Neither agent should leave the repository in an unvalidated state.
