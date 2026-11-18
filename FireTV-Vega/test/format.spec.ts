import {messageMeta, shortDate, startTimeLabel, upcomingLabel} from '../src/api/format';

describe('date labels (church local time, no time zone shifting)', () => {
  const now = '2026-11-17T16:00:00'; // Tuesday 4 PM

  it('labels a stream later today', () => {
    expect(upcomingLabel('2026-11-17T18:45:00', now)).toBe('Tonight, 6:45 PM');
  });
  it('labels tomorrow', () => {
    expect(upcomingLabel('2026-11-18T18:45:00', now)).toBe('Tomorrow, 6:45 PM');
  });
  it('uses the weekday within a week', () => {
    expect(upcomingLabel('2026-11-21T17:30:00', now)).toBe('Saturday, 5:30 PM');
    expect(upcomingLabel('2026-11-22T08:45:00', now)).toBe('Sunday, 8:45 AM');
  });
  it('uses the date beyond a week', () => {
    expect(upcomingLabel('2026-12-24T15:30:00', now)).toBe('Dec 24, 3:30 PM');
  });
  it('drops :00 minutes', () => {
    expect(startTimeLabel('17:00:00')).toBe('5 PM');
    expect(startTimeLabel('18:45:00')).toBe('6:45 PM');
  });
  it('formats message captions', () => {
    expect(shortDate('2026-11-15T00:00:00')).toBe('Nov 15');
    expect(messageMeta('2026-11-15T00:00:00', 'Pastor Dudley Rutherford')).toBe(
      'Nov 15 · Pastor Dudley Rutherford',
    );
    expect(messageMeta('2026-11-15T00:00:00', '')).toBe('Nov 15');
  });
});
