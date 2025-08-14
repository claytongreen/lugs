# Log Analyzer

Web app for parsing and analyzing mobile app log files. Drag and drop log files to view, filter, and link related log entries.

## Features

- **Drag & drop** log file upload
- **Smart parsing** of timestamps, levels, tags, UUIDs, and IDs
- **Filtering** by level, tag, UUID, ID, date range, and search
- **Log linking** by UUID/ID or temporal proximity
- **Navigation** through UUID/ID occurrences
- **Clickable filters** on log levels and tags
- **Original log display** toggle

## Usage

1. Drag and drop a log file onto the upload area
2. Use filters to narrow down logs
3. Click on UUIDs/IDs to find related logs
4. Use navigation buttons to jump between occurrences

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Builds to `/docs` for GitHub Pages deployment.
