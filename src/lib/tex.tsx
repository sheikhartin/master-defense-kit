/**
 * Equation rendering engine
 * ---------------------------------------------------------------
 * 1. Every equation is pre-rendered with KaTeX (local, offline) and cached in
 *    memory, so opening the cheat sheet shows equations with no perceptible
 *    delay and no layout shift.
 * 2. Every equation container is left-to-right (ltr) and isolated so it never
 *    breaks inside the Persian right-to-left flow.
 * 3. Every equation uses ASCII characters only; no Persian digit or letter is
 *    ever written inside a LaTeX expression (enforced by tests/verify-all.cjs).
 */

import { memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const KATEX_OPTIONS: katex.KatexOptions = {
  throwOnError: false,
  strict: false,
  output: 'html',
  trust: false,
  maxSize: 12,
  maxExpand: 40,
};

const cache = new Map<string, string>();

/** Render and cache one expression; returns an HTML string */
export function renderTex(tex: string, display = false): string {
  const key = (display ? 'd:' : 'i:') + tex;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const html = katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: display });
  cache.set(key, html);
  return html;
}

/** Warm the cache at app start so opening any section is instant */
export function warmTex(items: Array<{ tex: string; display?: boolean }>): void {
  for (const item of items) renderTex(item.tex, item.display ?? false);
}

type TeXProps = {
  tex: string;
  display?: boolean;
  className?: string;
};

/**
 * Safe equation component: the KaTeX output is injected as ready HTML and
 * never rendered as a text child, so nothing breaks in the RTL flow.
 */
export const TeX = memo(function TeX({ tex, display = false, className = '' }: TeXProps) {
  const html = renderTex(tex, display);
  if (display) {
    return (
      <div className={`tex-frame ${className}`} dir="ltr">
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }
  return (
    <span className={`tex-standalone ${className}`} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
  );
});

/** Equation inside a Persian sentence */
export function InlineTex({ tex }: { tex: string }) {
  return (
    <span className="tex-inline">
      <TeX tex={tex} />
    </span>
  );
}
