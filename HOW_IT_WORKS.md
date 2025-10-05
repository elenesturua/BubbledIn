# BubbledIn - How It Works

## 🎯 Current Setup

Your app uses a **simple, frontend-only approach** - no backend needed!

---

## 🎙️ Speech-to-Text (Real-time Transcription)

### **Technology: Web Speech API**
- Built into your browser (Chrome, Edge, Safari)
- FREE, no setup required
- Works immediately

### **How it works:**
1. Each participant's browser listens to their microphone
2. Browser transcribes speech in real-time
3. Transcription → saved to **Firestore**
4. Firestore syncs → **everyone sees everyone's words instantly**

```
Participant A speaks → Browser transcribes → Firestore
                                                ↓
Participant B's browser ← Firestore syncs ← Real-time updates
```

---

## 🤖 AI Summaries

### **Technology: Gemini 2.5 Pro**
- Google's most advanced AI model
- Runs from your frontend (no backend needed)

### **How it works:**
1. User clicks "AI Summary" button
2. Fetches all transcriptions from Firestore
3. Sends to Gemini AI
4. Receives: Summary, Key Points, Action Items
5. Displays in UI

---

## 🔥 Firebase Setup

### **What you're using:**
- ✅ **Firestore Database** - Stores transcriptions, rooms, participants
- ✅ **Firebase Authentication** - Anonymous sign-in (no accounts needed)

### **What you're NOT using:**
- ❌ Cloud Functions (deleted - not needed)
- ❌ Cloud Speech-to-Text API (using Web Speech API instead)

---

## 📁 Important Files

### **Keep These:**
- `firestore.rules` - Security rules for your database
- `.firebaserc` - Firebase project configuration
- `.env.local` - API keys (Firebase + Gemini)
- `src/services/transcriptionService.ts` - Web Speech API integration
- `src/services/summaryService.ts` - Gemini AI integration

### **Already Removed:**
- ~~`functions/`~~ - Firebase Functions (not needed)
- ~~`firebase.json`~~ - Functions config (not needed)
- ~~`SETUP_GUIDE.md`~~ - Outdated guide

---

## 🚀 How to Test

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Create a room** with "Live Captions" enabled

3. **Go to Captions tab** and start talking

4. **Watch your words appear in real-time!**

5. **Click "AI Summary"** to generate conversation summary

---

## 💰 Cost

### **FREE Tier:**
- Web Speech API: FREE (built into browser)
- Firestore: FREE up to 50K reads/day
- Gemini API: FREE up to 60 requests/minute

### **You're good for development and demos!** 🎉

---

## 🔧 Environment Variables Needed

Make sure your `.env.local` has:

```bash
# Firebase (for Firestore database)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Gemini (for AI summaries)
VITE_GEMINI_API_KEY=...
```

---

## 🎯 Features

- ✅ Real-time speech-to-text (Web Speech API)
- ✅ All participants see each other's transcriptions
- ✅ AI-powered conversation summaries (Gemini 2.5 Pro)
- ✅ Download/share transcripts
- ✅ Confidence scores for accuracy
- ✅ Works in Chrome, Edge, Safari
- ✅ No backend deployment needed
- ✅ FREE for development/demos

---

## 🐛 Troubleshooting

### "Speech recognition not supported"
- Use Chrome, Edge, or Safari (Firefox doesn't support Web Speech API)

### "Gemini API error"
- Check `VITE_GEMINI_API_KEY` in `.env.local`
- Make sure you're using `gemini-2.5-pro` model

### "Permission denied" in Firestore
- Update your Firestore rules in Firebase Console
- See `firestore.rules` file for correct rules

---

**That's it! Your app is ready to use.** 🚀

