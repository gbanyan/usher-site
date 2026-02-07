# Content Snapshots

This folder contains build-time content snapshots of the Laravel API.

Use cases:
- Build the Next.js site on Vercel without needing a live Laravel API.
- Keep a known-good static copy while the CMS/API is still in progress.

How to generate/update snapshots (requires Laravel running on port 8001):

```bash
npm run snapshot
```

By default this will also download article attachments into `public/attachments/`.

Options:
- `npm run snapshot -- --api http://localhost:8001/api/v1`
- `npm run snapshot -- --out ./content-snapshots`
- `npm run snapshot -- --skip-attachments`

