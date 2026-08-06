# Typography audit: editorial font direction

## Context

Tujiweze currently uses Space Grotesk as the primary UI family and Space Mono for numeric amounts and percentages:

- `src/theme/typography.ts` loads `@expo-google-fonts/space-grotesk` weights 300, 400, 500, 600, and 700.
- `src/bootstrap/AppProviders.tsx` loads the font map through `useFonts(customFontsToLoad)`.
- Shared text rendering goes through `src/components/Text.tsx`, with many feature screens also referencing `typography.primary` directly.

This is a solid functional baseline. Space Grotesk is friendly and contemporary, but it can make the app feel more playful than refined when paired with decorative emoji and soft rounded cards.

## Co-Star reference takeaways

The Co-Star site and app direction are best understood as stark editorial minimalism:

- restrained black, white, and grey palette
- text-led screens instead of illustration-led screens
- direct copy with strong hierarchy
- sparse ornamentation
- high contrast between large display text and compact supporting labels

The exact Co-Star font family is not publicly confirmed from reliable sources. The safer product move is to borrow the design principle rather than clone the typeface.

## Recommendation

Adopt an editorial display face for high-impact headings while keeping a highly legible sans for body and controls.

Recommended direction:

1. Keep Space Grotesk for body text, buttons, chips, labels, inputs, and dense task lists.
2. Add a display serif for screen titles, onboarding hero headings, and selected marketing-style empty states.
3. Keep Space Mono only for numeric values if that design rule remains important.
4. Do not use the display face inside small metadata, status badges, task cards, or multiline instructional copy.

Good candidate pairs:

| Role             | Candidate        | Why                                                                      |
| ---------------- | ---------------- | ------------------------------------------------------------------------ |
| Display          | Newsreader       | Editorial, warm, sophisticated, still readable on mobile.                |
| Display          | Instrument Serif | More dramatic and Co-Star-adjacent; best used sparingly.                 |
| Display          | Source Serif 4   | Safer, serious, less fashion-forward.                                    |
| Body             | Space Grotesk    | Already integrated; distinctive and mobile-friendly.                     |
| Body alternative | IBM Plex Sans    | More neutral and institutional if Space Grotesk still feels too playful. |

Preferred first experiment: Newsreader display + Space Grotesk body. It adds sophistication without making a practical farming app feel cold or occult.

## Implementation path

1. Add the selected Expo Google Font package with pnpm, for example `pnpm add @expo-google-fonts/newsreader`.
2. Extend `src/theme/typography.ts`:
   - import the display weights needed for headings only
   - add them to `customFontsToLoad`
   - add `typography.display`
3. Update shared text presets in `src/components/Text.tsx`:
   - keep `default`, `formLabel`, and `formHelper` on `typography.primary`
   - move `heading` and possibly `subheading` to `typography.display`
4. Update direct screen styles gradually:
   - onboarding step headings
   - Home greeting/section title hierarchy
   - Plan screen date/title hierarchy
   - Journal title and empty states
   - Profile hero name
5. Run `pnpm run compile`, `pnpm run lint:check`, and a visual pass on small Android dimensions.

## Risks and checks

- Font loading: every new weight increases startup asset work. Load only regular and bold/display weights at first.
- Internationalization: Arabic, Hindi, Japanese, and Korean strings will need platform fallback coverage. Do not force the display serif on non-Latin localized body copy without testing.
- Readability: Co-Star-style sparse typography can be striking, but Tujiweze has dense operational content. Keep task instructions, journal notes, and AI answers optimized for scanning.
- Brand fit: Tujiweze should feel capable and trustworthy, not mystical. Use the editorial face to sharpen hierarchy, not to change the product category.

## Suggested next design pass

After the emoji cleanup, the most valuable typography pass is:

- reduce decorative symbols in CTAs and headers
- use uppercase micro-labels more consistently
- increase heading contrast with a display family
- tighten section spacing before changing colors
- keep one brand accent per screen, as defined in the design tokens guidance
