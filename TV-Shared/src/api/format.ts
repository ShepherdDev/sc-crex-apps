const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Rock sends church-local times without a time zone ("2026-11-21T17:30:00").
 * We read the parts directly so the TV's own time zone setting can't shift them.
 */
function parts(iso: string) {
  const [d, t = '00:00:00'] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  return {y, m, day, hh, mm};
}

export function shortDate(iso: string): string {
  const p = parts(iso);
  return `${MONTHS[p.m - 1]} ${p.day}`;
}

export function clockTime(hh: number, mm: number): string {
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return mm === 0
    ? `${h} ${suffix}`
    : `${h}:${String(mm).padStart(2, '0')} ${suffix}`;
}

/** "Tonight, 6:45 PM", "Tomorrow, 8:45 AM", "Saturday, 5:30 PM" relative to `nowIso` (church time). */
export function upcomingLabel(startIso: string, nowIso: string): string {
  const s = parts(startIso);
  const n = parts(nowIso);
  const start = Date.UTC(s.y, s.m - 1, s.day);
  const today = Date.UTC(n.y, n.m - 1, n.day);
  const daysAway = Math.round((start - today) / 86400000);
  const time = clockTime(s.hh, s.mm);
  if (daysAway === 0) {
    return `${s.hh >= 17 ? 'Tonight' : 'Today'}, ${time}`;
  }
  if (daysAway === 1) {
    return `Tomorrow, ${time}`;
  }
  const weekday = DAYS[new Date(start).getUTCDay()];
  return daysAway < 7
    ? `${weekday}, ${time}`
    : `${MONTHS[s.m - 1]} ${s.day}, ${time}`;
}

/** "5:30 PM" from "17:30:00". */
export function startTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.split(':').map(Number);
  return clockTime(hh, mm);
}

export function messageMeta(date: string, speaker?: string): string {
  return speaker ? `${shortDate(date)} · ${speaker}` : shortDate(date);
}

/** Minutes from `nowIso` to `startIso`, both church local time. */
export function minutesUntil(startIso: string, nowIso: string): number {
  const s = parts(startIso);
  const n = parts(nowIso);
  const start = Date.UTC(s.y, s.m - 1, s.day, s.hh, s.mm);
  const now = Date.UTC(n.y, n.m - 1, n.day, n.hh, n.mm);
  return Math.round((start - now) / 60000);
}

/**
 * The home screen's "Next service in 3 hours" pill, counting down to when the
 * stream goes live (the schedule time). Returns the plain lead-in and the bold part.
 */
export function nextServiceLabel(
  startIso: string,
  nowIso: string,
): {lead: string; emphasis: string} {
  const mins = minutesUntil(startIso, nowIso);
  if (mins <= 0) {
    return {lead: 'Next service', emphasis: 'starting now'};
  }
  if (mins < 60) {
    return {
      lead: 'Next service in',
      emphasis: `${mins} minute${mins === 1 ? '' : 's'}`,
    };
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return {
      lead: 'Next service in',
      emphasis: `${hours} hour${hours === 1 ? '' : 's'}`,
    };
  }
  return {lead: 'Next service', emphasis: upcomingLabel(startIso, nowIso)};
}

/** "3:21", "12:24", "1:05:09" from seconds. */
export function playbackTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
