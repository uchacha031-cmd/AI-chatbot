import { ChatMessage, TemporalContext } from '../../types/index.ts';

/**
 * Dynamically resolves Vietnamese date, weekday, time, and timezone from the runtime clock.
 * Timezone: Asia/Ho_Chi_Minh (UTC+7).
 */
export function resolveVietnamTemporalInfo(date: Date = new Date()) {
  const timeZone = 'Asia/Ho_Chi_Minh';

  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  let rawWeekday = partMap.weekday || '';
  // Normalize title casing (e.g. "Thứ Ba", "Chủ Nhật")
  let currentWeekday = rawWeekday
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const day = partMap.day || date.getUTCDate().toString().padStart(2, '0');
  const month = partMap.month || (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = partMap.year || date.getUTCFullYear().toString();
  const hourStr = partMap.hour || '00';
  const minuteStr = partMap.minute || '00';
  const hourNum = parseInt(hourStr, 10);

  const currentDateFormatted = `${day}/${month}/${year}`;
  const currentTimeFormatted = `${hourStr}:${minuteStr}`;
  const displayDateVietnam = `${currentWeekday}, ${currentDateFormatted}`;
  const fullDateTimeString = `${currentWeekday}, ${currentDateFormatted} ${currentTimeFormatted}`;

  const enFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' });
  const currentWeekdayEn = enFormatter.format(date);

  return {
    currentDateFormatted,
    currentWeekday,
    currentWeekdayEn,
    currentTimeFormatted,
    timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
    displayDateVietnam,
    fullDateTimeString,
    localHour: hourNum,
  };
}

/**
 * Categorize the hour of the day into natural periods
 */
export function getTimeOfDay(hour: number): TemporalContext['timeOfDay'] {
  if (hour >= 0 && hour < 5) return 'late_night';
  if (hour >= 5 && hour < 7) return 'early_morning';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Format a Date object into HH:mm (e.g., "01:45" or "15:30")
 */
export function formatLocalTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Analyzes conversation timestamps to produce contextual temporal signals.
 * Resolves dynamic real date and weekday without surveillance analytics.
 */
export function buildTemporalContext(
  messages: ChatMessage[],
  currentTimeIso: string = new Date().toISOString()
): TemporalContext {
  const now = new Date(currentTimeIso);
  const vnInfo = resolveVietnamTemporalInfo(now);
  const timeOfDay = getTimeOfDay(vnInfo.localHour);
  const isLateNight = vnInfo.localHour >= 0 && vnInfo.localHour < 5;

  // 1. Calculate time since previous message (in seconds)
  let timeSincePreviousMessageSeconds: number | undefined;
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.timestamp) {
      const lastTime = new Date(lastMsg.timestamp).getTime();
      const diffMs = now.getTime() - lastTime;
      if (diffMs >= 0) {
        timeSincePreviousMessageSeconds = Math.round(diffMs / 1000);
      }
    }
  }

  // 2. Detect repeated late-night pattern across history (distinct days with late-night messages)
  const lateNightDates = new Set<string>();
  for (const msg of messages) {
    if (msg.role === 'user' && msg.timestamp) {
      const msgDate = new Date(msg.timestamp);
      const msgVnInfo = resolveVietnamTemporalInfo(msgDate);
      if (msgVnInfo.localHour >= 0 && msgVnInfo.localHour < 5) {
        lateNightDates.add(msgVnInfo.currentDateFormatted);
      }
    }
  }

  // Current session also counts if late night
  if (isLateNight) {
    lateNightDates.add(vnInfo.currentDateFormatted);
  }

  // If user has messaged late at night on 2 or more distinct calendar dates
  const repeatedLateNightPattern = lateNightDates.size >= 2;

  return {
    currentTimeIso: now.toISOString(),
    currentDateFormatted: vnInfo.currentDateFormatted,
    currentWeekday: vnInfo.currentWeekday,
    currentWeekdayEn: vnInfo.currentWeekdayEn,
    currentTimeFormatted: vnInfo.currentTimeFormatted,
    localTimeFormatted: vnInfo.currentTimeFormatted,
    timezone: vnInfo.timezone,
    displayDateVietnam: vnInfo.displayDateVietnam,
    fullDateTimeString: vnInfo.fullDateTimeString,
    timeOfDay,
    localHour: vnInfo.localHour,
    timeSincePreviousMessageSeconds,
    isLateNight,
    repeatedLateNightPattern,
  };
}
