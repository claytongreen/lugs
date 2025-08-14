import { BarChart3, FileText } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import DropZone from './components/DropZone';
import LogViewer from './components/LogViewer';
import { getLogStats, parseLogFile } from './utils/logParser';

function App() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const stats = useMemo(() => {
    return logs.length > 0 ? getLogStats(logs) : null;
  }, [logs]);

  const handleFileUpload = async (content, filename) => {
    setIsLoading(true);
    try {
      const parsedLogs = parseLogFile(content);
      setLogs(prevLogs => [...prevLogs, ...parsedLogs]);
      console.log(`Parsed ${parsedLogs.length} log entries from ${filename}`);
    } catch (error) {
      console.error('Error parsing log file:', error);
      alert(`Error parsing log file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container">
      <header style={{
        padding: '2rem 0',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <FileText size={32} color="#3b82f6" />
          <h1 style={{ color: '#1f2937', margin: 0 }}>Log Analyzer</h1>
        </div>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Upload and analyze your mobile app log files with automatic UUID linking and temporal relationships
        </p>
      </header>

      {logs.length === 0 ? (
        <DropZone onFileUpload={handleFileUpload} />
      ) : (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <BarChart3 size={24} color="#3b82f6" />
              <h2 style={{ color: '#1f2937', margin: 0 }}>Log Analysis</h2>
            </div>
            <button
              className="btn btn-secondary"
              onClick={clearLogs}
            >
              Clear All Logs
            </button>
          </div>

          <LogViewer logs={logs} stats={stats} />
        </div>
      )}

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Processing log file...</span>
        </div>
      )}
    </div>
  );
}

export default App;
