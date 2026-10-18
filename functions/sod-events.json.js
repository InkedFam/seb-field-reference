import ICAL from 'ical.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FEED_BYTES = 1024 * 1024;
const MAX_EVENTS = 100;
const MAX_OCCURRENCES_PER_SERIES = 100;
const EVENT_WINDOW_DAYS = 180;

function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function serializeTime(time) {
  if (time.isDate) {
    return `${String(time.year).padStart(4, '0')}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
  }
  return time.toJSDate().toISOString();
}

function makeEvent(item, startDate, endDate) {
  const component = item.component;
  const attachment = component.getFirstPropertyValue('attach');
  const startTime = serializeTime(startDate);
  const endTime = serializeTime(endDate);
  return {
    name: String(item.summary || '').trim().slice(0, 200),
    startTime,
    endTime,
    allDay: startDate.isDate,
    url: safeHttpUrl(component.getFirstPropertyValue('url')),
    photoUrl: safeHttpUrl(typeof attachment === 'string' ? attachment : ''),
    location: String(item.location || '').trim().slice(0, 300),
    description: String(item.description || '').trim().slice(0, 2000)
  };
}

export function parseCalendar(ics, now = new Date()) {
  const calendar = ICAL.Component.fromString(ics);
  const items = calendar.getAllSubcomponents('vevent').map(component => new ICAL.Event(component));
  const masters = items.filter(item => !item.isRecurrenceException());
  const exceptions = items.filter(item => item.isRecurrenceException());
  const byUid = new Map(masters.map(item => [item.uid, item]));
  for (const exception of exceptions) {
    try {
      byUid.get(exception.uid)?.relateException(exception);
    } catch {
      // Ignore malformed exceptions and retain the master event.
    }
  }

  const windowStart = new Date(now.getTime() - DAY_MS);
  const windowEnd = new Date(now.getTime() + EVENT_WINDOW_DAYS * DAY_MS);
  const events = [];

  function add(item, startDate, endDate) {
    if (events.length >= MAX_EVENTS || endDate.toJSDate() < windowStart || startDate.toJSDate() > windowEnd) return;
    if (item.component.getFirstPropertyValue('status') === 'CANCELLED') return;
    if (!String(item.summary || '').trim()) return;
    events.push(makeEvent(item, startDate, endDate));
  }

  for (const item of masters) {
    if (events.length >= MAX_EVENTS) break;
    if (!item.isRecurring()) {
      add(item, item.startDate, item.endDate);
      continue;
    }

    const iterator = item.iterator(ICAL.Time.fromJSDate(windowStart, true));
    let occurrence = iterator.next();
    let occurrenceCount = 0;
    while (occurrence && occurrence.toJSDate() <= windowEnd && occurrenceCount < MAX_OCCURRENCES_PER_SERIES && events.length < MAX_EVENTS) {
      const details = item.getOccurrenceDetails(occurrence);
      add(details.item, details.startDate, details.endDate);
      occurrence = iterator.next();
      occurrenceCount += 1;
    }
  }

  return events.sort((left, right) => left.startTime.localeCompare(right.startTime));
}

async function readLimitedText(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Calendar feed has no body');

  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_FEED_BYTES) {
      await reader.cancel();
      throw new Error('Calendar feed is too large');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function jsonResponse(body, status = 200, cacheControl = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function onRequestGet({ request, env, waitUntil }) {
  let feedUrl;
  try {
    feedUrl = new URL(env.GOOGLE_ICS_URL);
  } catch {
    return jsonResponse({ error: 'SOD event feed is not configured.' }, 503);
  }

  if (feedUrl.protocol !== 'https:' || !['calendar.google.com', 'www.google.com'].includes(feedUrl.hostname) || !feedUrl.pathname.startsWith('/calendar/ical/')) {
    return jsonResponse({ error: 'SOD event feed configuration is invalid.' }, 503);
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL('/__sod-events-cache', request.url));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(feedUrl, { redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Calendar feed request failed');
    const ics = await readLimitedText(response);
    const result = jsonResponse({ events: parseCalendar(ics) }, 200, 'public, max-age=300, s-maxage=300');
    waitUntil(cache.put(cacheKey, result.clone()));
    return result;
  } catch {
    return jsonResponse({ error: 'SOD events are unavailable right now.' }, 502);
  }
}