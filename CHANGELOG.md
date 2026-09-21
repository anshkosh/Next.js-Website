# Changelog

All notable changes to Anshkosh are documented here.

This project follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Audit follow-ups

- Fix the homepage motion fallback so reduced-motion users still see the hero headline, supporting copy, calls to action, and scroll-triggered sections.
- Review dark-mode surfaces and text colors, especially coral empty-state cards and the light hero artwork.
- Replace the placeholder `a` mark on authentication pages with the Anshkosh brand mark.
- Remove the nested `main` landmark from the Search page and align footer headings with the page hierarchy.
- Give the real 404 response a dedicated page title.

## [0.1.0] - 2026-09-21

### Added

- Added sticky navigation, responsive mobile navigation, skip-to-content support, scroll progress, scroll-to-top, floating contact access, and a simple cookie-consent banner.
- Added dark-mode support, full-site search, expandable FAQ content, password visibility controls, loading states, confirmation dialogs, copy-to-clipboard actions, and print styles.
- Added newsletter signup, updated journal dates, UTM attribution persistence, and improved button hover/focus states.
- Added sitemap, robots.txt, llms.txt, canonical metadata, page titles, descriptions, Open Graph metadata, Organization/WebSite schema, and internal SEO links.
- Added compressed responsive hero artwork and Next.js image optimization settings.
- Added a custom 404 page and pilot-friendly empty states for discovery, categories, and journal pages.

### Changed

- Standardized the Anshkosh brand name and `Ansh Kosh` alternate name across the homepage metadata and organization schema.
- Added official LinkedIn, GitHub, Product Hunt, and X profiles to the organization `sameAs` metadata.
- Updated startup, journal, category, legal, contact, FAQ, and authentication routes for responsive layouts and clearer hierarchy.
- Added HTTPS redirect and HSTS behavior for production requests.

### SEO notes

- Search-engine recognition still depends on deploying this branch, requesting indexing, and building consistent external entity citations. Structured data alone cannot remove search-engine autocorrection immediately.

