export const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
export const ID_REGEX = /\b\d{3,}\b/g;
export const DECIMAL_REGEX = /\b\d+\.\d+\b/g;

// Log line regex pattern - captures timestamp, level, and everything after the level
const LOG_REGEX = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2}):\s*([D|I|W|E])\/(.+)$/;

// Clean tag name by removing UUIDs, IDs, and extra details
function cleanTagName(tag) {
  // Remove UUIDs in square brackets
  let cleaned = tag.replace(/\[[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\]/gi, '');

  // Remove numeric IDs in square brackets
  cleaned = cleaned.replace(/\[\d+\]/g, '');

  // Remove status indicators like [DELETING], [UPDATING], etc.
  cleaned = cleaned.replace(/\[[A-Z]+\]/g, '');

  // Remove extra whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function parseLogLine(line) {
  const match = line.match(LOG_REGEX);
  if (!match) {
    return null;
  }

  const [, timestamp, level, tagAndMessage] = match;

  let tag, message;
  const splitIndex = Math.min(...[tagAndMessage.indexOf(' '), tagAndMessage.indexOf('[')].filter(index => index !== -1));
  if (splitIndex === -1) {
    tag = tagAndMessage;
    message = '';
  } else {
    tag = tagAndMessage.substring(0, splitIndex).trim();
    message = tagAndMessage.substring(splitIndex).trim();
  }

  if (!tag && !message) {
    return null;
  }

  // Extract UUIDs first
  const uuids = message.match(UUID_REGEX) || [];

  let messageCleaned = message;
  uuids.forEach(uuid => { messageCleaned = messageCleaned.replace(uuid, 'X'); });
  const decimals = messageCleaned.match(DECIMAL_REGEX) || [];
  decimals.forEach(decimal => { messageCleaned = messageCleaned.replace(decimal, 'X'); });

  // Extract generic IDs from the message with UUIDs and decimals masked
  const ids = messageCleaned.match(ID_REGEX) || [];

  return {
    original: line,
    timestamp,
    level,
    tag,
    cleanTag: cleanTagName(tag),
    message,
    uuids: [...new Set(uuids)], // Keep UUIDs separate
    ids: [...new Set(ids)], // Keep generic IDs separate
    date: new Date(timestamp)
  };
}

export function parseLogFile(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const parsedLogs = [];

  for (const line of lines) {
    const parsed = parseLogLine(line);
    if (parsed) {
      parsedLogs.push(parsed);
    }
  }

  return parsedLogs;
}

export function findRelatedLogs(logs, targetLog) {
  const related = [];

  // Check if we have any UUIDs or IDs to match
  const hasUUIDs = targetLog.uuids.length > 0;
  const hasIDs = targetLog.ids.length > 0;

  if (!hasUUIDs && !hasIDs) {
    // If no UUIDs or IDs, find logs within 5 minutes
    const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    const targetTime = targetLog.date.getTime();

    return logs.filter(log => {
      const timeDiff = Math.abs(log.date.getTime() - targetTime);
      return timeDiff <= timeWindow && log !== targetLog;
    });
  }

  for (const log of logs) {
    if (log === targetLog) continue;

    // Check if any UUIDs match
    const hasMatchingUUID = hasUUIDs && targetLog.uuids.some(uuid => log.uuids.includes(uuid));

    // Check if any IDs match
    const hasMatchingID = hasIDs && targetLog.ids.some(id => log.ids.includes(id));

    if (hasMatchingUUID || hasMatchingID) {
      related.push(log);
    }
  }

  return related;
}

export function groupLogsByUUID(logs) {
  const groups = new Map();

  for (const log of logs) {
    for (const id of log.uuids) {
      if (!groups.has(id)) {
        groups.set(id, []);
      }
      groups.get(id).push(log);
    }
  }

  return groups;
}

export function getLogStats(logs) {
  const stats = {
    total: logs.length,
    byLevel: {},
    byTag: {},
    uniqueUUIDs: new Set(),
    uniqueIDs: new Set(),
    timeRange: null
  };

  if (logs.length === 0) return stats;

  let earliest = logs[0].date;
  let latest = logs[0].date;

  for (const log of logs) {
    // Count by level
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

    // Count by clean tag
    stats.byTag[log.cleanTag] = (stats.byTag[log.cleanTag] || 0) + 1;

    // Collect unique UUIDs and IDs
    log.uuids.forEach(uuid => stats.uniqueUUIDs.add(uuid));
    log.ids.forEach(id => stats.uniqueIDs.add(id));

    // Track time range
    if (log.date < earliest) earliest = log.date;
    if (log.date > latest) latest = log.date;
  }

  stats.timeRange = {
    start: earliest,
    end: latest,
    duration: latest.getTime() - earliest.getTime()
  };

  return stats;
}
