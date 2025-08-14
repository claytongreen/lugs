# Log Analyzer

A modern web application for parsing and analyzing mobile app log files with automatic UUID linking and temporal relationship detection.

## Features

- **Drag & Drop Upload**: Simply drag and drop your log files onto the web app
- **Automatic Parsing**: Parses log files in the format `{date}: {level}/{tag} {message}`
- **UUID Linking**: Automatically detects and links related log entries by UUIDs
- **Temporal Relationships**: Links logs that occur within 5 minutes of each other when no UUIDs are present
- **Advanced Filtering**: Filter by log level, tag, search terms, or specific UUIDs
- **Real-time Statistics**: View comprehensive statistics about your log data
- **Interactive UI**: Click on UUIDs to find and highlight related log entries

## Supported Log Format

The application parses logs in the following format:
```
2025-08-08T06:14:23-06:00: D/UpdatePackWorker Success
2025-08-08T06:45:29-06:00: I/Analytics select_content Bundle[{content_type=TOURNAMENT, item_id=859}]
2025-08-08T07:27:05-06:00: D/MeasurementPhotoQrCodeWorker[35d2b61e-c942-4039-817c-1ee4ce80b426] Starting...
```

### Parsed Elements

- **Timestamp**: ISO 8601 format with timezone offset
- **Level**: D (Debug), I (Info), W (Warning), E (Error)
- **Tag**: Component or module name
- **Message**: The actual log message
- **UUIDs**: Automatically extracted from the message
- **Tournament IDs**: Extracted from `item_id=` patterns
- **Worker UUIDs**: Extracted from square bracket patterns

## Installation & Usage

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## How to Use

1. **Upload Log Files**: Drag and drop your `.log` or `.txt` files onto the upload area, or click to browse files
2. **View Parsed Logs**: Once uploaded, logs are automatically parsed and displayed
3. **Filter and Search**: Use the filter panel to search by text, filter by level/tag, or select specific UUIDs
4. **Explore Relationships**: Click on any UUID in the logs to find related entries
5. **View Statistics**: Check the statistics cards for insights about your log data

## Features in Detail

### UUID Detection and Linking

The application automatically detects several types of identifiers:

- **Standard UUIDs**: `35d2b61e-c942-4039-817c-1ee4ce80b426`
- **Tournament IDs**: `item_id=859` (extracted as `859`)
- **Worker UUIDs**: `[35d2b61e-c942-4039-817c-1ee4ce80b426]` (extracted as the UUID)

### Temporal Linking

When no UUIDs are found in a log entry, the application links it to other logs that occur within 5 minutes of each other, helping you trace related events.

### Advanced Filtering

- **Text Search**: Search within log messages and tags
- **Level Filter**: Filter by Debug, Info, Warning, or Error levels
- **Tag Filter**: Filter by specific component tags
- **UUID Filter**: Filter by specific UUIDs or tournament IDs
- **Related Logs**: Show only logs related to a selected UUID

### Statistics Dashboard

- Total number of log entries
- Count by log level
- Unique UUIDs and tournament IDs
- Time range of the log data
- Number of unique tags

## Technical Details

### Architecture

- **Frontend**: React 18 with functional components and hooks
- **Styling**: Custom CSS with modern design principles
- **Build Tool**: Vite for fast development and building
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for reliable date formatting

### Key Components

- `App.jsx`: Main application component and state management
- `DropZone.jsx`: Drag and drop file upload component
- `LogViewer.jsx`: Log display and filtering interface
- `LogEntry.jsx`: Individual log entry display component
- `logParser.js`: Core parsing and analysis utilities

### Performance Features

- Memoized filtering and calculations for large log files
- Efficient UUID detection using regex patterns
- Lazy loading of related logs
- Responsive design for various screen sizes

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and enhancement requests!
