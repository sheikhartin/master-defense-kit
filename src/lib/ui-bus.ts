/**
 * شمارنده سبک «لایه‌های باز» (پنجره‌ها و پنل‌ها).
 *
 * وقتی حتی یک لایه باز است، میان‌برهای سراسری و تک‌کلیدی باید سکوت کنند تا
 * چیزی پشت پنجره ناخواسته فعال نشود؛ فقط Escape مسئول بستن لایه است.
 * هر پنجره/پنل با قلاب useOverlay باز و بسته شدن خود را اعلام می‌کند.
 */

let openLayers = 0;

export function overlaysOpen(): boolean {
  return openLayers > 0;
}

export function acquireLayer(): () => void {
  openLayers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openLayers = Math.max(0, openLayers - 1);
  };
}
