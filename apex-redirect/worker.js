// Redirects the bare domain (usher.org.tw) to www, keeping path and query.
// Replaces Vercel's domain redirect after the move to Cloudflare (2026-10-23).
export default {
  fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(`https://www.usher.org.tw${url.pathname}${url.search}`, 308);
  },
};
