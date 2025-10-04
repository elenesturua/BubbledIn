# Firebase Setup for WebRTC

This document explains how to set up Firebase for the BubbledIn WebRTC application.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `bubbledin-webrtc`
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" authentication
5. Click "Save"

## 3. Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## 4. Set Firestore Security Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
      
      match /participants/{participantId} {
        allow read, write: if request.auth != null;
      }
      
      match /signaling/{participantId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## 5. Get Firebase Configuration

1. In Firebase Console, go to "Project settings"
2. Scroll down to "Your apps"
3. Click "Web" icon (`</>`)
4. Register app with nickname: `bubbledin-web`
5. Copy the configuration object

## 6. Create Environment File

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## 7. Database Structure

The app will create the following Firestore structure:

```
/rooms/{roomId}
  ├── name: string
  ├── settings: object
  ├── createdAt: timestamp
  ├── hostId: string
  └── participants: array

/rooms/{roomId}/participants/{participantId}
  ├── name: string
  ├── isHost: boolean
  ├── isMuted: boolean
  ├── isSpeaking: boolean
  └── joinedAt: timestamp

/rooms/{roomId}/signaling/{participantId}
  ├── offer: RTCSessionDescriptionInit
  ├── answer: RTCSessionDescriptionInit
  ├── iceCandidates: array
  └── timestamp: timestamp
```

## 8. Testing

1. Start the development server: `npm run dev`
2. Open the app in multiple browser tabs
3. Create a room in one tab
4. Join the room in another tab
5. Check Firebase Console to see real-time data updates

## 9. Production Considerations

- Update Firestore security rules for production
- Set up proper authentication (not just anonymous)
- Configure Firebase hosting if needed
- Set up monitoring and alerts
- Consider using Firebase Functions for server-side logic
