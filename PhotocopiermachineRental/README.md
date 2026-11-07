# Copixa — Photocopier & Office Machine Rental HTML Template

A multipurpose service-business HTML template built with **Tailwind CSS 3.4** and vanilla JavaScript.
It includes a full marketing website, a machine shop (rental cart, saved machines and checkout), a **client business portal** and an **admin dashboard**.

- 28 pages · mobile-first · light and dark mode · RTL (Arabic/Hebrew) ready
- No jQuery, no framework: one `main.js` plus `dashboard.js` for the portals
- Semantic HTML5 (W3C-valid), one `<h1>` per page, meta descriptions, Open Graph, JSON-LD (LocalBusiness, BlogPosting), `sitemap.xml`
- Accessible: skip link, visible focus, keyboard dropdowns and tabs, focus trapped in drawers, Escape closes menus, WCAG AA contrast
- Respects `prefers-reduced-motion`

## Pages

| Page | File |
|---|---|
| Home 1 — office machine rental | `index.html` |
| Home 2 — managed print for SaaS / agency offices | `home-2.html` |
| About (story, mission, timeline, team, testimonials) | `about.html` |
| Services (filter, grid/list view) | `services.html` |
| Service details (sidebar, pricing table, FAQ) | `service-details.html?s=<service>` |
| Machines catalogue (search, filter, sort, pagination, quick view) | `products.html` |
| Machine details (Description / Specifications / Reviews tabs) | `product.html?m=<machine>` |
| Checkout (company → delivery → payment) | `checkout.html` |
| Pricing (monthly/yearly, comparison, savings calculator) | `pricing.html` |
| Blog (search, categories, tags, pagination) | `blog.html` |
| Blog articles (9 posts, table of contents, previous/next, comments) | `blog-details.html`, `blog-details-<slug>.html` |
| Contact (form, Google map with directions, hours, depots) | `contact.html` |
| Client dashboard — overview, machines, request a machine, service calls, invoices, settings | `dashboard.html` |
| Admin dashboard — analytics, orders, users, messages | `admin.html` |
| Login · Register (plan sign-up) | `login.html` · `register.html` |
| 404 · Coming soon · Maintenance | `404.html` · `coming-soon.html` · `maintenance.html` |
| Privacy · Terms · Cookies · Sitemap | `legal.html` |

## Getting started

Open any `.html` file in a browser. The compiled CSS is already in `assets/css/style.css`, and the fonts are embedded, so the template also works when opened straight from disk.

To edit styles or add new Tailwind classes:

```bash
npm install
npm run watch      # rebuilds assets/css/style.css while you edit
npm run build      # minified CSS, then copies the finished site into ./public
```

Tailwind only generates classes it finds in the HTML/JS files, so **run a build after adding new classes**.

## Deploying (Vercel, Netlify, any static host)

`vercel.json` is included:

```json
{ "buildCommand": "npm run build", "outputDirectory": "public" }
```

`npm run build` compiles the CSS and then runs `scripts/build-public.mjs`, which copies every page, `assets/`, `robots.txt` and `sitemap.xml` into `public/`. Vercel therefore always finds the `public` output folder. On Netlify use the same build command and set the publish directory to `public`. Any other host: upload the contents of `public/`.

## How to change things

### Images
- Every photo is hot-linked from Unsplash (free licence) by its photo ID. Replace the `src`/`srcset` URL in the page with your own image path, for example `assets/img/my-copier.jpg`.
- Each photo is used for one subject only (one machine, one service, one article, one person or one page background). Keep it that way when you swap them, so no picture repeats.
- Machine photos look best as consistent product shots: same light background, same framing, machine facing the same way.
- Always write a meaningful `alt` text for content photos. Decorative backgrounds keep `alt=""`.

### Machines (products)
Machines appear in the catalogue, the machine details page, quick view, the cart and checkout. Their data lives in one JSON block at the bottom of every page: `<script type="application/json" id="machine-data">`. Each entry has `name`, `type`, `price` (per month), `ppm`, `paper`, `feat` (3 highlights), `desc`, `specs`, `img` and `thumb`.
To add a machine: add an entry to that JSON on each page (or regenerate the pages if you use the source generator), then copy one `<article ... data-cat="...">` card in `products.html` and change its `data-cat`, `data-price`, `data-speed`, the image, name and the `data-add-cart` / `data-wish` / `data-qv-slug` values to the new slug. Category filter counts update automatically.

### Content
- Text lives directly in the HTML. Headings intentionally have no full stops.
- **Opening hours** appear in the mobile menu, footer, contact page, checkout note and the JSON-LD schema. Search the project for `Mon–Fri 7am–8pm` and `openingHoursSpecification` and change them together. Date and time fields reject Sundays and times outside these hours; adjust `HOURS` near the top of the forms section in `assets/js/main.js` if your hours change.
- **Phone, email, address**: search for `+1 (800) 555-0199`, `hello@copixa.example.com` and `210 Harbour Street`.
- Blog articles: each article is its own file (`blog-details*.html`). Tags link to `blog.html?tag=<tag>` and categories to `blog.html?cat=<category>`.

### Map coordinates
The contact page uses a Google Maps embed. In `contact.html` change the iframe `src` query (`?q=Harbour+Street+San+Francisco+CA&output=embed`) to your address or to coordinates such as `?q=37.7801,-122.3921&output=embed`. Update the **Directions** links (`https://www.google.com/maps/dir/?api=1&destination=...`) on the map card and the three depot cards to match.

### Brand
- **Colours**: `tailwind.config.js` → `colors.brand` (primary), `ink` (neutrals), `cyanx / magentax / yellowx` (accent).
- **Fonts**: Sora (headings) and Manrope (body) are embedded in `assets/css/fonts.css`. To change them, put new `.woff2` files in `assets/fonts/`, edit and run `python3 scripts/build-fonts.py`, and update `fontFamily` in the config. IBM Plex Sans Arabic loads only when Arabic text is on the page.
- **Logo**: `assets/img/logo-mark.svg` plus the "Copixa." wordmark in the header and footer. The favicon (`assets/img/favicon.svg`) and the social preview image (`assets/img/og-image.jpg`) use the same mark.
- **Dark mode**: moon/sun button, stored in `localStorage` (`copixa-theme`), defaults to the OS setting.
- **RTL**: the ⇄ arrow button, stored as `copixa-dir`. For a permanently RTL site set `<html dir="rtl" lang="ar">`. The layout uses logical utilities (`ms-`, `pe-`, `start-`, `end-`), so it mirrors automatically.

### Icons
Line icons are from **Lucide** (ISC licence) and are inlined as SVG. Social buttons use the official brand marks from **Simple Icons** (CC0) and link to LinkedIn, X, Facebook and YouTube in a new tab. Replace the `href`s with your profile URLs.

## Shop, cart and plans

- Every machine card has **Add to cart**, a **heart** (save for later) and **Quick view**.
- The header shows the cart and saved-machines counts. Both open a drawer: change quantities, remove, move saved machines to the cart. Everything persists in `localStorage` (`copixa-cart`, `copixa-wish`).
- **Checkout** is a three-step flow with inline validation (phone, names, ZIP, delivery date and time within opening hours, card number with Luhn check, expiry and CVC). Placing the order shows an "Order placed" popup and empties the cart. Connect your payment provider before going live.
- **Subscription plans never go into the cart**: plan buttons open `register.html?plan=<plan>`, which pre-selects the plan in the sign-up form. Enterprise goes to the contact form.

## Forms

All forms validate in the browser and show an error message under each field:

- Phone fields accept digits and an optional leading `+` only (typing and pasting), minimum 9 digits.
- Name fields (full, first, last, name on card, comment name) accept letters, spaces, hyphens and apostrophes only.
- Required fields, consent checkboxes, email format, dates in the past, Sundays and times outside opening hours are all rejected with a clear message.
- Every `<select class="input">` is upgraded to a designed dropdown with hover, selected and keyboard states (arrows, Home/End, Enter, Escape, type-ahead). The native select stays in the page for forms and for no-JS visitors.

The forms are front-end demos (`data-demo-form="Success message"`, optional `data-success-title`). Connect them to your backend or a form service by removing the attribute and setting `action` / `method`.

## Animation system (data attributes)

| Attribute | Effect |
|---|---|
| `data-reveal="fade-up \| fade-down \| fade-start \| fade-end \| zoom-in \| zoom-out \| flip-up \| flip-start \| blur-in \| clip-up \| clip-start \| rotate-in \| skew-up \| sheet \| drop"` | Reveal on scroll |
| `data-delay="200"` · `data-stagger="100"` (on a parent) | Delay / stagger children |
| `data-split` | Word-by-word headline reveal (letters are never clipped) |
| `data-parallax="0.15"` | Parallax image |
| `data-count="2400"` | Animated counter |
| `data-tilt` | 3D pointer tilt |
| `.shake-hover` · `.jiggle-hover` + `.jiggle-target` · `.shake-once` | Card shake effects |
| `.sheet-stack > .sheet-card` | Sticky stacking "paper sheets" (tablet and up) |
| `data-hscroll` | Pinned horizontal scroll: cards move right to left, then the page continues |
| `data-explainer="4800"` | Auto-cycling animated explainer |
| `data-sheet-open="id"` | Side sheet (desktop) / bottom sheet (mobile) |
| `data-paginate="6"` + `<nav data-pagination>` | Pagination for any filter grid or dashboard table |
| `data-scrollspy` | In-page navigation highlights the section in view |
| `table.table-cards` | Table turns into labelled, padded cards on phones |

Smooth scrolling is powered by Lenis (`assets/vendor/lenis.min.js`). Remove that script tag to fall back to native scrolling.

## Credits

Tailwind CSS (MIT) · Chart.js (MIT) · Lenis (MIT) · Lucide icons (ISC) · Simple Icons (CC0) · Sora, Manrope, IBM Plex Sans Arabic (SIL OFL) · Photos: Unsplash.

## Browser support

Latest Chrome, Edge, Firefox, Safari (macOS/iOS) and Samsung Internet.
