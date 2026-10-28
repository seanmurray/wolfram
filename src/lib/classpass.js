// Handing off to ClassPass. There's no member API, and its search box puts
// nothing in the URL (checked 2026-10-28: /search?q= is ignored), so a link
// can't open a search with words filled in. Two things do work:
//   - a studio's own page (/studios/<slug>), which the user copies from
//     ClassPass's Share button and pastes into My studios;
//   - otherwise, the search page, with the words copied for the user to
//     paste. iOS opens classpass.com links in the ClassPass app when it's
//     installed (universal links), and in Safari when it isn't.

export const CLASSPASS_SEARCH = 'https://classpass.com/search';

// ClassPass's own site, and the short links its app's Share button makes.
const HOST = /(^|\.)classpass\.com$|(^|\.)classpass\.app\.link$/i;

// Pasted share text can carry words around the link ("Check out … https://…"):
// pull out the first ClassPass https URL, or null if there isn't one.
export function parseClassPassLink(text) {
  for (const m of String(text ?? '').matchAll(/https:\/\/[^\s<>"']+/g)) {
    try {
      const url = new URL(m[0].replace(/[).,;!]+$/, ''));
      if (HOST.test(url.hostname)) return url.href;
    } catch { /* not a URL */ }
  }
  return null;
}

// "Name, Town", or just the name.
export function studioLabel(studio) {
  const town = studio.town?.trim();
  return town ? `${studio.name.trim()}, ${town}` : studio.name.trim();
}

// Where "Find a class" goes for a saved studio: its page if we have it,
// otherwise the search page with "name town" to paste.
export function studioHandoff(studio) {
  if (studio.link) return { href: studio.link, copy: null };
  const words = [studio.name, studio.town].map((s) => s?.trim()).filter(Boolean).join(' ');
  return { href: CLASSPASS_SEARCH, copy: words };
}

// Fire-and-forget: called from the link's click so the navigation keeps the
// tap (awaiting first would lose it and Safari would block the new tab).
export function copyForSearch(words) {
  if (!words) return;
  try { navigator.clipboard?.writeText(words).catch(() => {}); } catch { /* ignore */ }
}
