# Baby Monitor Video Streaming Setup

## Overview
The BabyMonitorStream component supports live video streaming for the baby monitor feature.

## Features
- ✅ Live video stream display
- ✅ Fullscreen mode
- ✅ Play/Pause controls
- ✅ Mute/Unmute audio
- ✅ Screenshot capability
- ✅ Loading states
- ✅ "No stream" placeholder

## Setting Up Video Streaming

### Option 1: Using a Test Video URL
For testing purposes, you can use a sample video URL:
```typescript
<BabyMonitorStream 
  babyName={babyName}
  streamUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
/>
```

### Option 2: Using IP Camera/Webcam Stream
If you have an IP camera or want to use a phone as a camera:

1. **Install IP Webcam app** on an Android phone (or similar iOS app)
2. **Start the server** in the app
3. **Get the stream URL** (usually something like `http://192.168.1.X:8080/video`)
4. **Use the URL** in your component:
```typescript
<BabyMonitorStream 
  babyName={babyName}
  streamUrl="http://192.168.1.X:8080/video"
/>
```

### Option 3: Using WebRTC for Real-Time Streaming
For production-grade real-time streaming:

1. Set up a WebRTC server (e.g., using Janus, Kurento, or Agora)
2. Use React Native WebRTC library
3. Connect camera device to WebRTC server
4. Stream from server to app

### Option 4: Using a Backend Streaming Service
1. Set up a camera connected to your backend
2. Use libraries like:
   - `node-rtsp-stream` for RTSP cameras
   - `ffmpeg` for stream conversion
   - `socket.io` for real-time updates
3. Expose stream endpoint from backend
4. Connect to endpoint in the app

## Current Implementation
- Component location: `frontend/src/components/BabyMonitorStream.tsx`
- Uses `expo-av` for video playback
- Supports HLS, RTSP (via conversion), and HTTP video streams
- Has built-in controls and fullscreen support

## Next Steps
1. Replace the empty `streamUrl` with your actual stream URL
2. Test with a sample video first
3. Set up your camera/streaming infrastructure
4. Update the URL to point to your live stream

## Troubleshooting
- If video doesn't load, check network connectivity
- Ensure the stream URL is accessible from your device
- For iOS, make sure the URL uses HTTPS or add it to `Info.plist` exceptions
- Check console logs for detailed error messages
