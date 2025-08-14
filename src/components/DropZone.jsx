import { Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

const DropZone = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    for (const file of files) {
      if (file.type === 'text/plain' || file.name.endsWith('.log') || file.name.endsWith('.txt')) {
        try {
          const content = await file.text();
          onFileUpload(content, file.name);
        } catch (error) {
          console.error('Error reading file:', error);
          alert(`Error reading file ${file.name}: ${error.message}`);
        }
      } else {
        alert(`File ${file.name} is not a supported text file.`);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card">
      <div
        className={`dropzone ${isDragging ? 'dragover' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".log,.txt,text/plain"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Upload size={48} color="#6b7280" style={{ marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>
          Drop your log files here
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          or click to browse files
        </p>
      </div>
    </div>
  );
};

export default DropZone;
