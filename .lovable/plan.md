

## Plan: Redesign Partners Page — Elevated, Production-Grade UI

### Aesthetic Direction
**Editorial minimalism with data density** — inspired by Linear's precision and Notion's spatial clarity. The Partners page should feel like a curated directory, not a generic list. Key differentiator: partner type expressed through color-coded geometric accents, with a summary header that gives instant context.

### Changes

**1. Summary Header Strip**
Replace the plain title with a horizontal stat bar showing partner count by type (referral, delivery, technology, etc.) using small colored dots/pills. Gives instant portfolio overview.

**2. Partner Cards — Grid Layout with Type Accent**
- Switch from vertical list to a responsive 2-3 column grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`)
- Each card gets a thin left border in a type-specific color (referral=cyan, delivery=purple, technology=indigo, content=pink, other=muted)
- Show initials avatar circle, name, email, commission rate as a small mono-font badge
- Subtle stagger-in animation on load using existing `.stagger-in` utility

**3. Search & Filter Bar**
Add a search input + type filter dropdown between the header and grid. Filter partners by type or search by name/email.

**4. Empty State**
Replace plain text with a styled empty state using the existing `EmptyState` component pattern — illustration-free, just an icon + message + CTA button.

**5. Dialog Polish**
Minor spacing and label refinements in `PartnerDialog` for consistency with the rest of the app.

### Files Modified
- `src/pages/Partners.tsx` — full rewrite of the page layout and card rendering

### Technical Notes
- No new dependencies needed
- Uses existing design tokens (vivid colors, card component, badge, stagger-in)
- Fully responsive with the existing breakpoint system
- All CRUD functionality preserved exactly as-is

