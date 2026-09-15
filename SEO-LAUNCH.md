# Production launch decisions

Confirmed primary domain: https://mr-suds.ca/ (owner, 2026-09-15).

The GitHub Pages site remains a preview. Before production launch:
- Set self-referencing canonicals on every final page under mr-suds.ca, using the final deployed paths.
- Replace preview article canonicals that currently point to the original mobiledetailingvancouverisland.ca pages.
- Prepare a per-page permanent redirect map from both old sites; preserve relevant articles rather than redirecting everything to the home page.
- Add a sitemap with final URLs and verify indexing rules.
- Configure hosting/DNS and redirects only as part of the production migration.

Pricing clarification: F-150 belongs to the standard half-ton group: Standard $320, Premium $520. Midsize trucks (Tacoma, Ranger, Ridgeline, Frontier) retain the owner's listed Standard $350 / Premium $620. These are service pricing groups, not a ranking by vehicle size.

## Prepared mapping (not active)

- `migration/redirects.csv`: 25 confirmed original gallery/article URLs to their proposed production destinations. This is not the full inventory of either old website. Old service and blog URLs still need a separate content mapping; do not redirect them all to the home page.
- `migration/canonical-targets.csv`: final canonical targets for the current 30 HTML pages, assuming the current file paths are retained.
- Hosting remains undecided. Apply 301 redirects through the selected host only after destination pages return 200. A CSV file does not implement redirects.
- Publish the final sitemap and robots rules during production setup, then verify Google Search Console and Bing Webmaster Tools ownership and submit the sitemap.
- Check www/non-www and HTTP/HTTPS redirects, preserve old valuable content, and test real booking delivery before switching traffic.

The preview's existing canonical settings have not been changed to currently missing production URLs.
