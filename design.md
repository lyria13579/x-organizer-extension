# X Organizer Design

## Product Position

X Organizer is a local-first Chrome extension that turns X/Twitter bookmarks, likes, reposts, and visible posts into a searchable, categorized, AI-queryable library.

The website should feel like a silver hardware product with a live intelligence core: polished, calm, luminous, and immediately useful.

## Visual Direction

- **Palette**: silver white background, violet primary glow, blue secondary light, black ink for product seriousness.
- **Surface**: frosted panels, metallic borders, soft mesh gradients, no heavy card stacking.
- **Energy**: WebGL core in the hero to suggest indexing, memory, and AI retrieval.
- **Typography**: large compact display headlines, readable body copy, zero negative letter spacing.
- **Mood**: high-end productivity tool, not a crypto landing page and not a generic SaaS dashboard.

## Color Tokens

```css
--ink: #161522;
--muted: #6e6a7f;
--violet: #6f63ff;
--violet-dark: #3320d6;
--cyan: #11b7ff;
--silver: #f7f6fb;
--line: rgba(45, 40, 74, 0.12);
```

## Motion System

- **Typewriter hero**: the primary headline types in character-by-character with a luminous cursor.
- **Indexing intro**: a short archive-indexing loader creates a stronger opening moment before the page reveals.
- **Cursor spotlight**: a soft violet/silver light follows pointer position to make the page feel reactive.
- **Progressive loading rail**: capture, classify, search, and ask steps fill in sequence to make the data pipeline visible.
- **Magnetic CTAs**: primary buttons follow the pointer slightly and use a passing sheen on hover.
- **Floating product stack**: screenshots drift with scroll parallax and scale/rotate on hover.
- **WebGL core**: the central indexing object rotates continuously with orbit rings and particle memory points.
- **Scroll reveals**: sections enter with blur, lift, and staggered timing.
- **Kinetic index wall**: oversized archive words move horizontally with scroll, inspired by editorial creative studio sites.
- **Query cards**: prompt-like cards float over the index wall to connect visual motion to product use cases.
- **Tilt cards**: feature cards react to pointer position with 3D rotation and a moving silver highlight.
- **Dock interactions**: dock icons expand based on hover distance, inspired by motion primitive dock behavior.
- **Accordion**: FAQ panels expand smoothly with icon rotation.

## Reference Mapping

- Creative studio pacing and opening energy: Wonder Makers, Active Theory, Obys, Unseen.
- Large editorial typography and motion-led index sections: Obys, Recent Design, Refs Gallery.
- Immersive product storytelling with real screenshots: Immersive Garden, Noomo, Fantik.
- Media-card/preset-card rhythm: Higgsfield and Tasteskill.
- Practical design-document framing: getdesign.md and Vercel `design.md`.

## WebGL Element

The hero uses React Three Fiber:

- Icosahedron wireframe as the "organized knowledge core".
- Two torus rings as capture/index orbits.
- Particle field as saved posts.
- Violet and cyan light to match the product palette.

## Page Structure

1. **Hero**
   - Product name and direct value proposition.
   - GitHub and download CTAs.
   - WebGL intelligence core.
   - Real extension screenshots.

2. **Features**
   - Card library.
   - AI categories.
   - Search by intent.
   - Local-first privacy.

3. **Workflow**
   - Capture.
   - Organize.
   - Ask.

4. **AI**
   - Bring your own model API.
   - Provider examples.
   - Card-based AI answer preview.

5. **FAQ**
   - No official X API requirement.
   - Local API key storage.
   - GitHub download path.

## Content Rules

- Lead with usefulness: "bookmarks and likes become a library".
- Avoid vague AI claims.
- Keep privacy explicit and calm.
- Always show real product screenshots where possible.
- Keep CTAs concrete: GitHub and Download extension.

## Implementation Notes

- Frontend lives in `website/`.
- Start locally with `npm run dev:web`.
- Build with `npm run build:web`.
- The site imports real screenshots from `docs/screenshots/`.
- The GitHub CTA points to `https://github.com/lyria13579/x-organizer-extension`.
- The download CTA points to the GitHub main branch zip archive.
