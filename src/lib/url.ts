const SAFE_PROTOCOL = /^(https?|ircs?|mailto|xmpp)$/i;

/** Mirrors react-markdown's defaultUrlTransform. Use for every CMS-supplied URL placed in an href/src. */
export function safeUrl(url: string): string {
  const colon = url.indexOf(":");
  const question = url.indexOf("?");
  const hash = url.indexOf("#");
  const slash = url.indexOf("/");
  if (
    colon < 0 ||
    (slash > -1 && colon > slash) ||
    (question > -1 && colon > question) ||
    (hash > -1 && colon > hash) ||
    SAFE_PROTOCOL.test(url.slice(0, colon))
  ) {
    return url;
  }
  return "";
}
