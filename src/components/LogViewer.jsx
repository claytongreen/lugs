import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { findRelatedLogs } from '../utils/logParser';
import LogEntry from './LogEntry';

const LogViewer = ({ logs, stats }) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const searchValueRef = useRef('');
  const debounceTimerRef = useRef(null);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedUUID, setSelectedUUID] = useState('');
  const [selectedID, setSelectedID] = useState('');
  const [currentUUIDIndex, setCurrentUUIDIndex] = useState(0);
  const [currentIDIndex, setCurrentIDIndex] = useState(0);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const trackRef = useRef(null);

  // Calculate time range for the slider
  const timeRange = useMemo(() => {
    if (logs.length === 0) return { min: 0, max: 0 };

    const timestamps = logs.map(log => log.date.getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);

    return { min, max };
  }, [logs]);

  // Initialize date range with full range if not set
  const currentStart = dateRange.start || timeRange.min;
  const currentEnd = dateRange.end || timeRange.max;

  // Optimize search input to prevent re-renders
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    searchValueRef.current = value;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 150);
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Filter by date range first (most restrictive)
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(log => {
        const logTime = log.date.getTime();
        const startTime = dateRange.start ? new Date(dateRange.start).getTime() : timeRange.min;
        const endTime = dateRange.end ? new Date(dateRange.end).getTime() : timeRange.max;
        return logTime >= startTime && logTime <= endTime;
      });
    }

    // Filter by level
    if (selectedLevel) {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(log => log.cleanTag === selectedTag);
    }

    // Filter by search term last (most expensive)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.tag.toLowerCase().includes(searchLower) ||
        log.cleanTag.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [logs, debouncedSearchTerm, selectedLevel, selectedTag, dateRange, timeRange]);

  const relatedLogs = useMemo(() => {
    if (!selectedUUID && !selectedID) return new Set();

    const related = new Set();
    logs.forEach(log => {
      const hasMatchingUUID = selectedUUID && log.uuids.includes(selectedUUID);
      const hasMatchingID = selectedID && log.ids.includes(selectedID);

      if (hasMatchingUUID || hasMatchingID) {
        const relatedToLog = findRelatedLogs(logs, log);
        relatedToLog.forEach(relatedLog => related.add(relatedLog));
        related.add(log);
      }
    });

    return related;
  }, [logs, selectedUUID, selectedID]);

  const displayedLogs = filteredLogs;

  const handleUUIDClick = useCallback((uuid) => {
    setSelectedUUID(uuid);
    setSelectedID('');
    setCurrentUUIDIndex(0);
    setCurrentIDIndex(0);
  }, []);

  const handleIDClick = useCallback((id) => {
    setSelectedID(id);
    setSelectedUUID('');
    setCurrentUUIDIndex(0);
    setCurrentIDIndex(0);
  }, []);

  const handleLevelClick = useCallback((level) => {
    setSelectedLevel(selectedLevel === level ? '' : level);
  }, [selectedLevel]);

  const handleTagClick = useCallback((tag) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
  }, [selectedTag]);

  const jumpToUUID = useCallback((action = 'next') => {
    const selectedItem = selectedUUID || selectedID;
    const currentIndex = selectedUUID ? currentUUIDIndex : currentIDIndex;
    const setCurrentIndex = selectedUUID ? setCurrentUUIDIndex : setCurrentIDIndex;

    if (!selectedItem) return;

    const matchingIndices = displayedLogs
      .map((log, index) => {
        if (selectedUUID) return log.uuids.includes(selectedUUID) ? index : -1;
        if (selectedID) return log.ids.includes(selectedID) ? index : -1;
        return -1;
      })
      .filter(index => index !== -1);

    if (matchingIndices.length === 0) return;

    let targetIndex;
    let newCurrentIndex;

    switch (action) {
      case 'first':
        targetIndex = matchingIndices[0];
        newCurrentIndex = 0;
        break;
      case 'previous':
        newCurrentIndex = (currentIndex - 1 + matchingIndices.length) % matchingIndices.length;
        targetIndex = matchingIndices[newCurrentIndex];
        break;
      case 'next':
        newCurrentIndex = (currentIndex + 1) % matchingIndices.length;
        targetIndex = matchingIndices[newCurrentIndex];
        break;
      case 'last':
        targetIndex = matchingIndices[matchingIndices.length - 1];
        newCurrentIndex = matchingIndices.length - 1;
        break;
      case 'current':
        targetIndex = matchingIndices[currentIndex % matchingIndices.length];
        newCurrentIndex = currentIndex;
        break;
      default:
        return;
    }

    const logElement = document.querySelector(`[data-log-index="${targetIndex}"]`);
    if (logElement) {
      logElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      logElement.style.backgroundColor = '#fef3c7';
      setTimeout(() => { logElement.style.backgroundColor = ''; }, 2000);
    }

    if (action !== 'current') {
      setCurrentIndex(newCurrentIndex);
    }
  }, [selectedUUID, selectedID, currentUUIDIndex, currentIDIndex, displayedLogs]);

  const clearFilters = () => {
    searchValueRef.current = '';
    setDebouncedSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setSelectedLevel('');
    setSelectedTag('');
    setSelectedUUID('');
    setSelectedID('');
    setCurrentUUIDIndex(0);
    setCurrentIDIndex(0);
    setDateRange({ start: null, end: null });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSliderMouseDown = (e, type) => {
    e.preventDefault();
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const isStart = type === 'start';

    const handleMouseMove = (moveEvent) => {
      const x = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const value = timeRange.min + (percentage * (timeRange.max - timeRange.min));

      // Snap to full days
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      const snappedValue = date.getTime();

      if (isStart) {
        if (snappedValue <= currentEnd) {
          setDateRange(prev => ({ ...prev, start: snappedValue }));
        }
      } else {
        if (snappedValue >= currentStart) {
          setDateRange(prev => ({ ...prev, end: snappedValue }));
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getUniqueTags = () => {
    const tags = new Set();
    logs.forEach(log => tags.add(log.cleanTag));
    return Array.from(tags).sort();
  };

  const getUniqueUUIDs = () => {
    const uuids = new Set();
    logs.forEach(log => {
      log.uuids.forEach(uuid => uuids.add(uuid));
    });
    return Array.from(uuids).sort();
  };

  const getUniqueIDs = () => {
    const ids = new Set();
    logs.forEach(log => {
      log.ids.forEach(id => ids.add(id));
    });
    return Array.from(ids).sort();
  };

  return (
    <div>
      {/* Filters */}
      <div className="card filters-sticky" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Filter size={20} color="#6b7280" />
          <h3 style={{ margin: 0, color: '#374151' }}>Filters</h3>
          <button
            className="btn btn-secondary"
            onClick={clearFilters}
            style={{ marginLeft: 'auto' }}
          >
            <X size={16} style={{ marginRight: '0.25rem' }} />
            Clear
          </button>
          {(selectedUUID || selectedID) && (() => {
            const selectedItem = selectedUUID || selectedID;
            const currentIndex = selectedUUID ? currentUUIDIndex : currentIDIndex;
            const matchingCount = displayedLogs.filter(log => {
              if (selectedUUID) return log.uuids.includes(selectedUUID);
              if (selectedID) return log.ids.includes(selectedID);
              return false;
            }).length;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                <div
                  onClick={() => jumpToUUID('current')}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e5e7eb';
                    e.target.style.color = '#1f2937';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.color = '#374151';
                  }}
                  title="Click to jump to current occurrence"
                >
                  {matchingCount > 0 ? `${currentIndex + 1}/${matchingCount}` : '0/0'}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => jumpToUUID('first')}
                    title="Jump to first occurrence"
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                  >
                    <ChevronFirst size={16} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => jumpToUUID('previous')}
                    title="Jump to previous occurrence"
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => jumpToUUID('next')}
                    title="Jump to next occurrence"
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => jumpToUUID('last')}
                    title="Jump to last occurrence"
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                  >
                    <ChevronLast size={16} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="filters">
          <div className="filter-group">
            <label>Level</label>
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              <option value="">All Levels</option>
              <option value="D">Debug</option>
              <option value="I">Info</option>
              <option value="W">Warning</option>
              <option value="E">Error</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Tag</label>
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
              <option value="">All Tags</option>
              {getUniqueTags().map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>UUID</label>
            <select value={selectedUUID} onChange={(e) => setSelectedUUID(e.target.value)}>
              <option value="">All</option>
              {getUniqueUUIDs().map(uuid => (
                <option key={uuid} value={uuid}>
                  {uuid.length > 20 ? `${uuid.substring(0, 8)}...` : uuid}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>ID</label>
            <select value={selectedID} onChange={(e) => setSelectedID(e.target.value)}>
              <option value="">All</option>
              {getUniqueIDs().map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>

          <div className="filter-group" style={{ flex: 1, marginLeft: 'auto' }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: searchValueRef.current !== debouncedSearchTerm ? '#3b82f6' : '#9ca3af',
                  transition: 'color 0.2s'
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search in messages and tags..."
                defaultValue=""
                onChange={handleSearchChange}
                style={{
                  paddingLeft: '2rem',
                  width: '100%',
                  borderColor: searchValueRef.current !== debouncedSearchTerm ? '#3b82f6' : undefined
                }}
              />
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <div style={{ position: 'relative', paddingTop: '1rem' }}>
            <div
              ref={trackRef}
              style={{
                position: 'relative',
                height: '6px',
                backgroundColor: '#e5e7eb',
                borderRadius: '3px',
                marginBottom: '1rem'
              }}
            >
              {/* Track fill */}
              <div style={{
                position: 'absolute',
                left: `${((currentStart - timeRange.min) / (timeRange.max - timeRange.min)) * 100}%`,
                right: `${100 - ((currentEnd - timeRange.min) / (timeRange.max - timeRange.min)) * 100}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: '3px'
              }} />

              {/* Custom draggable thumbs */}
              <div
                style={{
                  position: 'absolute',
                  left: `${((currentStart - timeRange.min) / (timeRange.max - timeRange.min)) * 100}%`,
                  top: '-5px',
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transform: 'translateX(-50%)',
                  cursor: 'grab',
                  zIndex: 5
                }}
                onMouseDown={(e) => handleSliderMouseDown(e, 'start')}
                title="Drag to adjust start date"
              />

              <div
                style={{
                  position: 'absolute',
                  left: `${((currentEnd - timeRange.min) / (timeRange.max - timeRange.min)) * 100}%`,
                  top: '-5px',
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transform: 'translateX(-50%)',
                  cursor: 'grab',
                  zIndex: 5
                }}
                onMouseDown={(e) => handleSliderMouseDown(e, 'end')}
                title="Drag to adjust end date"
              />
            </div>

            {/* Date labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
              <span>{formatDate(currentStart)}</span>
              {/* Full range info */}
              {timeRange.min !== timeRange.max && (
                <div style={{ textAlign: 'center' }}>
                  Full range: {formatDate(timeRange.min)} - {formatDate(timeRange.max)}
                </div>
              )}
              <span>{formatDate(currentEnd)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{displayedLogs.length}</div>
            <div className="stat-label">Filtered Logs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Logs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.uniqueUUIDs.size}</div>
            <div className="stat-label">Unique UUIDs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.uniqueIDs.size}</div>
            <div className="stat-label">Unique IDs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(stats.byTag).length}</div>
            <div className="stat-label">Unique Tags</div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
          Log Entries ({displayedLogs.length})
        </h3>

        {displayedLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No logs match the current filters
          </div>
        ) : (
          <div>
            {displayedLogs.map((log, index) => {
              const isRelated = (selectedUUID || selectedID) ? relatedLogs.has(log) : false;
              const isHighlighted = (selectedUUID && log.uuids.includes(selectedUUID)) ||
                (selectedID && log.ids.includes(selectedID));

              return (
                <LogEntry
                  key={`${log.timestamp}-${index}`}
                  data-log-index={index}
                  log={log}
                  isLinked={isRelated}
                  isHighlighted={isHighlighted}
                  isSubtle={(selectedUUID || selectedID) && !isRelated}
                  onUUIDClick={handleUUIDClick}
                  onIDClick={handleIDClick}
                  onLevelClick={handleLevelClick}
                  onTagClick={handleTagClick}
                  selectedLevel={selectedLevel}
                  selectedTag={selectedTag}
                  highlightedUUIDs={selectedUUID ? [selectedUUID] : []}
                  highlightedIDs={selectedID ? [selectedID] : []}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
