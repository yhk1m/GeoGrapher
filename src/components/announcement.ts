// © 2026 김용현
// 업데이트 알림을 띄울지 정한다. 컴포넌트 파일과 나눠 둔다 — 빠른 새로고침은
// 컴포넌트만 내보내는 파일에서만 동작한다.

export const ANNOUNCEMENT_KEY = 'geographer.announcement.csat-chart-2-2026-10.dismissed';

/** 이 시각부터는 알림을 띄우지 않는다 — 2026-10-22(한국 시각) 하루까지 */
export const ANNOUNCEMENT_UNTIL = Date.parse('2026-10-22T15:00:00Z');

export function shouldShowAnnouncement(): boolean {
  if (Date.now() >= ANNOUNCEMENT_UNTIL) return false;
  try {
    return localStorage.getItem(ANNOUNCEMENT_KEY) !== '1';
  } catch {
    return true;
  }
}

export function dismissAnnouncement(): void {
  try { localStorage.setItem(ANNOUNCEMENT_KEY, '1'); } catch { /* noop */ }
}
