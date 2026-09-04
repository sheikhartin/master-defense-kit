/**
 * ذخیره‌سازی امن در حافظه محلی مرورگر.
 * همه داده‌های کاربر (یادداشت‌ها، هایلایت‌ها، پیشرفت تمرین و تنظیمات)
 * فقط در localStorage همین دستگاه می‌ماند و هرگز به جایی ارسال نمی‌شود.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'bcoa-defense:';

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* حافظه پر یا در دسترس نبود؛ سکوت می‌کنیم تا جریان تمرین نشکند */
  }
}

export function removeStore(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* نادیده */
  }
}

/** همان useState با آینه‌سازی خودکار در localStorage */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStore(key, initial));

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeStore(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}

/** یادداشت کوتاه متنی با ذخیره خودکار (دِبَونس) */
export function useStoredNote(key: string) {
  const [text, setText] = useState<string>(() => readStore(key, ''));
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    };
  }, []);

  const setNote = useCallback(
    (next: string) => {
      setText(next);
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => writeStore(key, next), 250);
    },
    [key],
  );

  return [text, setNote] as const;
}

/** علامت هایلایت نرم برای کلیدهای محتوا */
export function useStoredFlag(key: string) {
  const [on, setOn] = useStoredState<boolean>(key, false);
  const toggle = useCallback(() => setOn((v) => !v), [setOn]);
  return [on, toggle] as const;
}
