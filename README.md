# Online Clipboard

A simple, real-time online clipboard that allows you to share text content between multiple devices seamlessly. Built with Next.js and featuring automatic synchronization with timestamp-based conflict resolution.

## Features

- **Real-time Sync**: Content automatically synchronizes between devices in real-time
- **Multi-device Support**: Access your clipboard from any device using a unique ID
- **Auto-save**: Content is automatically saved as you type (500ms debounce)
- **Focus-aware Polling**: Smart polling that only runs when windows are unfocused to avoid conflicts
- **Toast Notifications**: Clean, non-intrusive notifications for sync status
- **Timestamp-based Conflict Resolution**: Latest changes always win, preventing data loss
- **Responsive Design**: Works perfectly on desktop and mobile devices

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Enter a Clipboard ID**: Use the default ID or create a unique one
2. **Add Content**: Type or paste content into the text area
3. **Auto-sync**: Content automatically saves and syncs across devices
4. **Multi-device Access**: Use the same ID on other devices to access your content

## Technical Architecture

### Sync Strategy
- **Data Source Tracking**: Distinguishes between server updates and user input to prevent feedback loops
- **Timestamp-based Resolution**: Uses server timestamps to determine the most recent changes
- **Focus-aware Polling**: Only polls for updates when the window is not focused (every 2 seconds)
- **Stale Closure Prevention**: Uses refs to ensure polling always has current state values

### Storage
- **Development**: In-memory storage for local development
- **Production**: Vercel KV (Redis) for persistent, scalable storage
- **Automatic Fallback**: Gracefully falls back to in-memory if KV is unavailable

### Components
- **Toast System**: Custom toast notifications with auto-dismiss and manual close
- **Controlled Inputs**: React controlled components with proper state management
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Environment Variables

For production deployment with persistent storage:

```bash
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token
```

If these are not set, the app will use in-memory storage (data won't persist between server restarts).

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure KV environment variables
3. Deploy automatically on push

### Other Platforms
The app can be deployed to any platform that supports Next.js. For persistent storage, you'll need to set up the KV environment variables.

## Development

Built with:
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vercel KV** - Redis storage
- **React Hooks** - State management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
