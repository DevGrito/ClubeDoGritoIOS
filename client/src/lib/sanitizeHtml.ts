import DOMPurify from "dompurify";

/** Sanitiza HTML externo (ex.: WordPress) antes de dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}
