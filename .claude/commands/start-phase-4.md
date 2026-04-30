# /start-phase-4 — Marketing Content

Generate all marketing content. Can run in parallel with Phase 3.

## Parallel — All marketing content at once

### @marketing-agent task:
"Generate all marketing content as defined in your agent instructions:
1. Landing page copy → update apps/web/src/pages/Home.tsx with full sections
2. Create docs/marketing/email-sequences.md — waitlist, onboarding (5 emails), upgrade nudge, weekly digest
3. Create docs/marketing/seo-content.md — meta tags for all pages, 3 blog post outlines, target keywords
4. Create docs/marketing/social-media.md — Twitter launch thread, Instagram caption, Product Hunt copy
5. Create docs/marketing/landing-page-copy.md — full raw copy for reference

Tone: warm, literary, proud bibliophile energy. Not corporate. Not over-technical.
Return DONE with all files created."

## After marketing-agent returns DONE

### @qa-agent task (brand review):
"Review all files in docs/marketing/ for:
- Consistent brand voice (warm, literary, not corporate)
- No claims that can't be substantiated (no 'millions of readers')
- All CTAs are clear and specific
- Email subjects are under 50 characters
- No broken links or placeholder text remaining ([INSERT X])
- SEO meta descriptions are 120-160 characters
Report any issues found."

## Completion
"Phase 4 complete. Review docs/marketing/ and update Home.tsx copy if needed. Run /start-phase-5 to deploy."
