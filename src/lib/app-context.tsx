/**
 * Global app context: typography settings, color palette, focus mode, print state and navigation.
 * All of these (except focus mode) are persisted in localStorage.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStoredState, writeStore } from './storage';
import { applyPalette, DEFAULT_PALETTE } from './palettes';
import type { PaletteId } from '../types';

export type TabId = 'home' | 'practice' | 'cheat' | 'qa' | 'checklist';

/** PDF export scope: one section or the whole site */
export type PrintScope = 'all' | 'roadmap' | 'deck' | 'cheat' | 'qa' | 'checklist';

/** Maps each tab to its matching print scope */
export const printScopeOfTab: Record<TabId, PrintScope> = {
  home: 'roadmap',
  practice: 'deck',
  cheat: 'cheat',
  qa: 'qa',
  checklist: 'checklist',
};

interface AppState {
  tab: TabId;
  go: (tab: TabId, slideIndex?: number) => void;
  /** Request to start practice at a specific slide (zero means from the start) */
  pendingStart: { slide: number; stamp: number } | null;
  consumeStart: () => void;

  /** Global reading typography */
  textScale: number;
  setTextScale: (v: number) => void;
  lineHeight: number;
  setLineHeight: (v: number) => void;

  /** Soft audible alert (optional) */
  audible: boolean;
  setAudible: (v: boolean) => void;

  /** Professional color palette */
  palette: PaletteId;
  setPalette: (v: PaletteId) => void;

  /** Focus mode */
  focus: boolean;
  setFocus: (v: boolean) => void;

  /** Single-key shortcuts (WCAG 2.1.4: the user can turn them off) */
  shortcutsOn: boolean;
  setShortcutsOn: (v: boolean) => void;

  /** Global key guide */
  guideOpen: boolean;
  setGuideOpen: (v: boolean) => void;

  /** Print / PDF output: the active scope, or null when closed */
  printScope: PrintScope | null;
  openPrint: (scope?: PrintScope) => void;
  closePrint: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('home');
  const [pendingStart, setPendingStart] = useState<{ slide: number; stamp: number } | null>(null);
  const [printScope, setPrintScope] = useState<PrintScope | null>(null);

  const [textScale, setTextScale] = useStoredState<number>('pref:textScale', 1);
  const [lineHeight, setLineHeight] = useStoredState<number>('pref:lineHeight', 1.95);
  const [audible, setAudible] = useStoredState<boolean>('pref:audible', false);
  const [shortcutsOn, setShortcutsOn] = useStoredState<boolean>('pref:shortcuts', true);
  const [palette, setPaletteState] = useStoredState<PaletteId>('pref:palette', DEFAULT_PALETTE);
  const [focus, setFocusState] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const go = useCallback((next: TabId, slideIndex?: number) => {
    setTab(next);
    if (next === 'practice' && slideIndex !== undefined) {
      setPendingStart({ slide: slideIndex, stamp: Date.now() });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const consumeStart = useCallback(() => setPendingStart(null), []);

  const setFocus = useCallback((v: boolean) => setFocusState(v), []);

  const setPalette = useCallback(
    (v: PaletteId) => {
      setPaletteState(v);
      applyPalette(v);
    },
    [setPaletteState],
  );

  const openPrint = useCallback((scope: PrintScope = 'cheat') => setPrintScope(scope), []);
  const closePrint = useCallback(() => setPrintScope(null), []);

  // Apply the palette on load and on change
  useEffect(() => {
    applyPalette(palette);
  }, [palette]);

  const state = useMemo<AppState>(
    () => ({
      tab,
      go,
      pendingStart,
      consumeStart,
      textScale,
      setTextScale,
      lineHeight,
      setLineHeight,
      audible,
      setAudible,
      palette,
      setPalette,
      focus,
      setFocus,
      shortcutsOn,
      setShortcutsOn,
      guideOpen,
      setGuideOpen,
      printScope,
      openPrint,
      closePrint,
    }),
    [
      tab,
      go,
      pendingStart,
      consumeStart,
      textScale,
      setTextScale,
      lineHeight,
      setLineHeight,
      audible,
      setAudible,
      palette,
      setPalette,
      focus,
      setFocus,
      shortcutsOn,
      setShortcutsOn,
      guideOpen,
      setGuideOpen,
      printScope,
      openPrint,
      closePrint,
    ],
  );

  // Sync the focus-mode class on body
  useEffect(() => {
    document.body.classList.toggle('focus-active', focus);
    return () => document.body.classList.remove('focus-active');
  }, [focus]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AppProvider not found');
  return ctx;
}

/** Persist the last practice position so practice can resume */
export interface SessionMarker {
  slide: number; // zero-based index
  totalSeconds: number;
  slideSeconds: number;
  running: boolean;
  stamp: number;
}

export function rememberSession(marker: SessionMarker): void {
  writeStore('session:last', marker);
}

/**
 * Apply the font scale and line spacing to one region.
 */
export function readingStyle(scale: number, lineHeight: number): React.CSSProperties {
  return {
    fontSize: `${Math.round(scale * 100)}%`,
    lineHeight,
    ['--reading-lh' as string]: `${lineHeight}`,
  } as React.CSSProperties;
}
