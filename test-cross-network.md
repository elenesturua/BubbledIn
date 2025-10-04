# Cross-Network Connectivity Test Guide

## Quick Test Steps

### 1. Local Network Test (Baseline)
1. Open two browser tabs/windows on the same computer
2. Create a room in one tab
3. Join the room in the other tab
4. Verify audio works (should work as before)

### 2. Same WiFi Network Test
1. Use two different devices on the same WiFi network
2. Create a room on one device
3. Join the room on the other device
4. Verify audio communication works

### 3. Cross-Network Test (Main Goal)
1. Use two devices on different networks:
   - Device A: Home WiFi
   - Device B: Mobile hotspot or different WiFi
2. Create a room on Device A
3. Join the room on Device B using the QR code or room ID
4. Verify audio communication works

### 4. Mobile + WiFi Test
1. Use one device on WiFi and another on mobile data
2. Test room creation and joining
3. Verify audio works between mobile and WiFi users

## What to Look For

### Success Indicators
- ✅ Room creation/joining works across networks
- ✅ Audio streams are received and played
- ✅ No "Connection failed" errors in console
- ✅ ICE connection state shows "connected"
- ✅ Participants can hear each other clearly

### Debug Information
Open browser console and look for:
- `🔗 Creating peer connection for participant:`
- `🧊 ICE connection state changed to: connected`
- `✅ ICE connected to participant:`
- `📥 Received remote stream from participant:`

### Common Issues
- **"ICE connection failed"**: TURN servers not working, try different network
- **"Connection timeout"**: Network firewall blocking WebRTC
- **"No audio"**: Microphone permissions or audio element issues
- **"Room not found"**: Firebase configuration or room ID issues

## Network Requirements

### Firewall Ports
WebRTC needs these ports open:
- **UDP 3478**: STUN/TURN servers
- **UDP 5349**: TURNS (TURN over TLS)
- **UDP 49152-65535**: RTP media streams
- **TCP 443**: HTTPS and TURNS

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Edge**: Full support

## Troubleshooting

### If Cross-Network Doesn't Work

1. **Check Console Logs**:
   ```javascript
   // Look for these messages
   console.log('🧊 ICE connection state changed to: failed');
   console.error('❌ ICE candidate error');
   ```

2. **Test TURN Servers**:
   - Visit: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
   - Test the TURN servers manually

3. **Network Configuration**:
   - Try different networks (mobile vs WiFi)
   - Check if corporate firewall blocks WebRTC
   - Test from different locations

4. **Browser Settings**:
   - Ensure microphone permissions are granted
   - Try incognito/private browsing mode
   - Clear browser cache and cookies

### Fallback Options

If TURN servers fail, the app will:
1. Try direct peer-to-peer connection
2. Retry connection up to 3 times
3. Show error message if all attempts fail

## Production Testing

For production deployment, test with:
- Users in different countries
- Corporate networks with strict firewalls
- Mobile networks with carrier-grade NAT
- Different time zones and network conditions

## Support

If issues persist:
1. Check the browser console for error messages
2. Test with different browsers
3. Try from different network locations
4. Contact support with specific error messages
