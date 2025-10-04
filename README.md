# BubbledIn

BubbledIn is a real-time audio app that creates private, low-latency "bubbles" for communication in loud, chaotic environments like hackathons, expos, and classrooms. Are you bubbled'in?

This project was originally designed in Figma: https://www.figma.com/design/e3FaLvdKYPEpaKjrWuuzEW/Audio-Bubble-App

## Features

- 🎙️ **Crystal Clear Audio** - WebRTC-powered audio with noise reduction
- 📱 **QR Code Joining** - Instant room access via QR code scanning
- 💬 **Live Transcription** - Real-time speech-to-text captions
- ♿ **Accessibility-First** - WCAG 2.1 AA compliant with full keyboard navigation
- 🎛️ **Advanced Controls** - Push-to-talk functionality
- 🔒 **Privacy-Focused** - No accounts, no tracking, temporary rooms

## Setting Up Firebase

This app uses Firebase for real-time communication and room management. You'll need to set up environment variables:

1. **Create your Firebase project** at https://console.firebase.google.com
2. **Enable Authentication** (Anonymous sign-in)
3. **Enable Firestore Database** (Start in test mode)
4. **Get your credentials** from Project Settings → General → Your apps → Web app
5. **Create environment file:**
   ```bash
   cp env.template .env
   ```
6. **Fill in your Firebase credentials** in the `.env` file

## Running the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Tech Stack

- React 18 + TypeScript
- Vite
- Radix UI + Tailwind CSS
- WebRTC for audio communication
- Lucide React for icons

## Perfect For

✓ Hackathons and tech competitions  
✓ Demo days and startup expos  
✓ Crowded classrooms and study groups  
✓ Conference networking and meetups  
✓ Team collaboration in noisy spaces
