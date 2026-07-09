# States, Copy, and Motion Checklist

Use this checklist before adding or changing user-facing copy, empty states, loading states, feedback, or animations.

## Language

- [ ] All user-facing copy is Simplified Chinese.
- [ ] No English labels, placeholders, empty states, modal text, toast text, button text, tabs, or tags.
- [ ] Technical English is allowed only in code identifiers, filenames, dependency names, and technical documentation.

## Copy Tone

- [ ] Home guidance, pet menu, empty states, completion feedback, song/task explanations may be playful.
- [ ] Delete confirmations, errors, permission failures, cloud failures, save failures, and irreversible-data warnings stay restrained and explicit.
- [ ] No childish or overly cutesy error copy (e.g., "数据飞走咯").

## States

- [ ] Loading states use `wd-loading` or token-driven breath animation classes.
- [ ] Empty states use the `empty-state` component.
- [ ] Error states show a clear Chinese message and a retry affordance.
- [ ] Success feedback is gentle (e.g., "已经轻轻收好").

## Motion

- [ ] Motion uses registered motion tokens (`--app-duration-*`, `--app-transition-*`, `--app-ease-*`).
- [ ] No raw `transition: 0.3s` or `animation: 2s` values.
- [ ] Micro-interactions are light: card press, gentle pop, soft menu expansion, pet breath.
- [ ] No page-level showpiece transitions, high-frequency loops, particles, strong bounce, large animated gradients, or decoration that harms reading/tapping/scrolling/keyboard use.

## Accessibility and Performance

- [ ] Motion respects `prefers-reduced-motion` where feasible.
- [ ] Animations do not block interaction or cause layout thrash.
- [ ] Pet navigator animation is subtle and pauses during touch/drag/menu-open.
