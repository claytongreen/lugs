import { format } from 'date-fns';
import React, { memo, useState } from 'react';
import { DECIMAL_REGEX, ID_REGEX, UUID_REGEX } from '../utils/logParser';

const LogEntry = memo(({ log, isLinked = false, isHighlighted = false, isSubtle = false, onUUIDClick, onIDClick, onLevelClick, onTagClick, selectedLevel = '', selectedTag = '', highlightedUUIDs = [], highlightedIDs = [], ...props }) => {
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM dd HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const highlightIds = (text) => {
    if (!text) return text;

    // Create a map of original text positions to their types
    const positions = [];

    // Add UUID positions
    let uuidMatch;
    while ((uuidMatch = UUID_REGEX.exec(text)) !== null) {
      positions.push({
        start: uuidMatch.index,
        end: uuidMatch.index + uuidMatch[0].length,
        text: uuidMatch[0],
        type: 'uuid'
      });
    }

    let decimalMatch;
    while ((decimalMatch = DECIMAL_REGEX.exec(text)) !== null) {
      positions.push({
        start: decimalMatch.index,
        end: decimalMatch.index + decimalMatch[0].length,
        text: decimalMatch[0],
        type: 'decimal'
      });
    }
    // Add ID positions (from original text, but we'll filter out those that overlap with UUIDs)
    let idMatch;
    while ((idMatch = ID_REGEX.exec(text)) !== null) {
      // Check if this ID overlaps with any UUID
      const overlaps = positions.some(pos =>
        pos.type !== 'id' &&
        idMatch.index >= pos.start &&
        idMatch.index + idMatch[0].length <= pos.end
      );

      if (!overlaps) {
        positions.push({
          start: idMatch.index,
          end: idMatch.index + idMatch[0].length,
          text: idMatch[0],
          type: 'id'
        });
      }
    }

    // Sort positions by start index
    positions.sort((a, b) => a.start - b.start);

    // Build the result by splitting the text at the positions
    const result = [];
    let lastIndex = 0;

    positions.forEach((pos, index) => {
      // Add text before this position
      if (pos.start > lastIndex) {
        result.push(text.substring(lastIndex, pos.start));
      }

      // Add the highlighted element
      if (pos.type === 'uuid') {
        const isHighlighted = highlightedUUIDs.includes(pos.text);
        const isSelected = highlightedUUIDs.length > 0 && highlightedUUIDs[0] === pos.text;
        result.push(
          <span
            key={`uuid-${index}`}
            className={`uuid-link ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => onUUIDClick(pos.text)}
            title="Click to find related logs"
          >
            {pos.text}
          </span>
        );
      } else if (pos.type === 'id') {
        const isHighlighted = highlightedIDs.includes(pos.text);
        const isSelected = highlightedIDs.length > 0 && highlightedIDs[0] === pos.text;
        result.push(
          <span
            key={`id-${index}`}
            className={`uuid-link ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => onIDClick(pos.text)}
            title="Click to find related logs"
          >
            {pos.text}
          </span>
        );
      } else {
        result.push(pos.text);
      }

      lastIndex = pos.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }

    return result;
  };

  const getLevelClass = (level) => {
    const levelMap = {
      'D': 'debug',
      'I': 'info',
      'W': 'warning',
      'E': 'error'
    };
    return levelMap[level] || 'debug';
  };

  const [showOriginal, setShowOriginal] = useState(false);

  const getEntryClasses = () => {
    const classes = [`log-entry ${getLevelClass(log.level)}`];
    if (isLinked) classes.push('linked');
    if (isHighlighted) classes.push('highlighted');
    if (isSubtle) classes.push('subtle');
    return classes.join(' ');
  };

  const renderMessage = () => (
    <div className="log-message">
      {highlightIds(log.message)}
    </div>
  );

  return (
    <div className={getEntryClasses()} {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
        <span
          className={`log-level ${log.level} ${onLevelClick && selectedLevel === log.level ? 'active' : ''}`}
          onClick={() => onLevelClick && onLevelClick(log.level)}
          style={{ cursor: onLevelClick ? 'pointer' : 'default' }}
          title={onLevelClick ? (selectedLevel === log.level ? 'Click to clear level filter' : 'Click to filter by this level') : undefined}
        >
          {log.level}
        </span>
        <span
          className={`log-tag ${onTagClick && selectedTag === log.cleanTag ? 'active' : ''}`}
          title={log.tag}
          onClick={() => onTagClick && onTagClick(log.cleanTag)}
          style={{ cursor: onTagClick ? 'pointer' : 'default' }}
        >
          {log.cleanTag}
        </span>
        {isSubtle && renderMessage()}
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            backgroundColor: '#f3f4f6'
          }}
          title={showOriginal ? 'Hide original line' : 'Show original line'}
        >
          {showOriginal ? 'Hide Original' : 'Show Original'}
        </button>
      </div>

      {!isSubtle && renderMessage()}

      {showOriginal && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
          fontSize: '0.875rem',
          color: '#374151',
          wordBreak: 'break-all'
        }}>
          {log.original}
        </div>
      )}
    </div>
  );
});

export default LogEntry;
