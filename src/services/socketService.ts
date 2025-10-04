import { io, Socket } from 'socket.io-client';
import { WEBRTC_CONFIG, MEDIA_CONSTRAINTS } from '../webrtc/config';

function createSocketService() {
  let socket: Socket | null = null;

  const connect = () => {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socket = io(serverUrl, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return socket;
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  const joinRoom = (roomId: string, userId: string) => {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('join-room', roomId, userId);
  };

  const leaveRoom = (roomId: string) => {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('leave-room', roomId);
  };

  const sendOffer = (offer: RTCSessionDescriptionInit, targetUserId: string) => {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('offer', offer, targetUserId);
  };

  const sendAnswer = (answer: RTCSessionDescriptionInit, targetUserId: string) => {
    if (!socket) throw new Error('Socket not connected');
    socket.emit('answer', answer, targetUserId);
  };

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      return stream;
    } catch (error) {
      console.error('Microphone access denied:', error);
      throw error;
    }
  };

  const createPeerConnection = () => {
    return new RTCPeerConnection(WEBRTC_CONFIG);
  };

  return {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendOffer,
    sendAnswer,
    requestMicrophoneAccess,
    createPeerConnection,
    getSocket: () => socket
  };
}

export const socketService = createSocketService();
export default socketService;
