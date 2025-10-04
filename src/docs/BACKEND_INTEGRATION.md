# BubbledIn Backend Integration Guide

## MVP Backend Architecture (24-hour hackathon timeline)

### Core Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Database**: MongoDB (Atlas free tier)
- **Audio**: WebRTC + Google Cloud Speech-to-Text API
- **Hosting**: Heroku (frontend) + Railway (backend)

### 1. Real-time Communication (Priority 1 - 4 hours)

**WebRTC Peer-to-Peer Setup**

```javascript
// Room signaling server
const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", userId);
  });

  socket.on("offer", (offer, targetUserId) => {
    socket.to(targetUserId).emit("offer", offer, socket.id);
  });

  socket.on("answer", (answer, targetUserId) => {
    socket.to(targetUserId).emit("answer", answer, socket.id);
  });
});
```

### 2. Room Management (Priority 1 - 2 hours)

**Room Creation & Joining**

```javascript
// Room state management
const rooms = new Map();

const createRoom = (roomName, hostId) => {
  const roomId = generateRoomId();
  const room = {
    id: roomId,
    name: roomName,
    host: hostId,
    participants: [hostId],
    createdAt: Date.now(),
    settings: {
      transcription: true,
      presenterMode: false,
      pushToTalk: false,
    },
  };
  rooms.set(roomId, room);
  return room;
};
```

### 3. Speech-to-Text Integration (Priority 2 - 4 hours)

**Google Cloud Speech-to-Text**

```javascript
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

const transcribeAudioStream = (audioStream, roomId) => {
  const request = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
      alternativeLanguageCodes: ["es-ES", "fr-FR"],
      enableSpeakerDiarization: true,
      diarizationSpeakerCount: 4,
    },
    audio: audioStream,
    interimResults: true,
  };

  client.recognizeStream(request).on("data", (data) => {
    io.to(roomId).emit("transcription", {
      transcript: data.results[0].alternatives[0].transcript,
      confidence: data.results[0].alternatives[0].confidence,
      isFinal: data.results[0].isFinal,
      speakerTag: data.results[0].words[0].speakerTag,
    });
  });
};
```

### 4. MVP Database Schema (Priority 2 - 2 hours)

**MongoDB Collections**

```javascript
// Rooms collection
{
  _id: ObjectId,
  roomId: String, // 6-character code
  name: String,
  hostId: String,
  participants: [String], // user IDs
  createdAt: Date,
  expiresAt: Date,
  settings: {
    transcription: Boolean,
    presenterMode: Boolean,
    pushToTalk: Boolean
  },
  transcriptions: [{
    speaker: String,
    text: String,
    timestamp: Date,
    confidence: Number
  }]
}

// Users collection (minimal for MVP)
{
  _id: ObjectId,
  sessionId: String, // browser session
  name: String,
  joinedRooms: [String], // room IDs
  lastSeen: Date
}
```

### 5. API Endpoints (Priority 3 - 3 hours)

**Essential Endpoints**

```javascript
// Room management
POST /api/rooms - Create room
GET /api/rooms/:roomId - Get room info
POST /api/rooms/:roomId/join - Join room
DELETE /api/rooms/:roomId/leave - Leave room

// Transcription
GET /api/rooms/:roomId/transcript - Get full transcript
POST /api/rooms/:roomId/bulk-translate - Translate transcript

// Health & monitoring
GET /api/health - Health check
GET /api/stats - Usage statistics
```

### 6. Frontend Integration Points (Priority 1 - 3 hours)

**Main integration files to create:**

1. `src/services/socketService.ts` - Socket.IO client
2. `src/services/roomService.ts` - Room API calls
3. `src/hooks/useTranscription.ts` - Transcription state
4. `src/hooks/useAudioRoom.ts` - Room management
5. `src/utils/webrtc.ts` - WebRTC utilities

### 7. Environment Setup (Priority 1 - 1 hour)

**Environment Variables**

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CREDENTIALS_PATH=./google-credentials.json

# Backend (.env)
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bubbledIn
GOOGLE_CLOUD_PROJECT_ID=bubbled-in-dev
NODE_ENV=development
```

### 8. Deployment Strategy (Priority 3 - 2 hours)

**Production Setup**

1. Frontend → Heroku (static site)
2. Backend → Railway (Node.js app)
3. Database → MongoDB Atlas
4. CDN → CloudFlare (free tier)

**Quick Deployment Commands**

```bash
# Frontend deployment
npm run build
mv dist/* ../backend/public/

# Backend deployment
npm run deploy:backend
```

### 9. MVP Feature Priorities

**Must-Have (Core):**

- ✅ Room creation/joining
- ✅ WebRTC audio communication
- ✅ Real-time transcription
- ✅ QR code sharing
- ✅ Participant list

**Nice-to-Have (Next):**

- 📝 Transcript export/sharing
- 🌐 Multi-language support
- 🎙️ Audio quality optimization
- 📊 Analytics dashboard

**Future Enhancements:**

- 🎯 Noise cancellation
- 📱 Mobile optimization
- 🔔 Push notifications
- 👥 User accounts/auth

### 10. 24-Hour Timeline

**Hours 1-6:** Core WebRTC + Socket.IO
**Hours 7-10:** Room management + Database
**Hours 11-15:** Speech-to-Text integration
**Hours 16-19:** Frontend integration
**Hours 20-22:** Testing & bug fixes
**Hours 23-24:** Deployment & demo prep

### 11. Demo Script Points

1. **Create room** → Show QR code generation
2. **Join room** → Demonstrate instant connection
3. **Audio quality** → Compare with/without noise cancellation
4. **Live captions** → Show real-time transcription
5. **Mobile compatibility** → Test on phone
6. **Accessibility** → Screen reader demo
7. **Multi-language** → Translate transcript feature

This MVP focuses on core functionality with a clear path to production deployment within 24 hours.
