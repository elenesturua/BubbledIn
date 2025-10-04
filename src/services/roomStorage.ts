interface RoomData {
  id: string;
  name: string;
  settings: {
    pushToTalk: boolean;
    transcription: boolean;
  };
  host: boolean;
  url: string;
}

interface StoredRoom extends Omit<RoomData, 'participants'> {
  participants: Participant[];
}

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isPresenter: boolean;
  joinedAt: number;
}

// Simple in-memory storage for demo (you'd replace this with real backend)
class RoomStorage {
  private rooms: Map<string, StoredRoom> = new Map();

  createRoom(roomData: RoomData): RoomData {
    const storedRoom: StoredRoom = {
      ...roomData,
      participants: [
        {
          id: 'host-1',
          name: 'You (Host)',
          isHost: true,
          isMuted: false,
          isPresenter: roomData.host,
          joinedAt: Date.now()
        }
      ]
    };
    
    this.rooms.set(roomData.id, storedRoom);
    
    // Persist to localStorage for demo
    this.persistRooms();
    
    return roomData;
  }

  joinRoom(roomId: string, participantInfo?: { name?: string }): { success: boolean; room?: StoredRoom } {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false };
    }

    // Add new participant
    const newParticipant: Participant = {
      id: `participant-${Date.now()}`,
      name: participantInfo?.name || `Guest ${room.participants.length}`,
      isHost: false,
      isMuted: false,
      isPresenter: false,
      joinedAt: Date.now()
    };

    room.participants.push(newParticipant);
    this.persistRooms();

    return { success: true, room };
  }

  getRoom(roomId: string): StoredRoom | undefined {
    return this.rooms.get(roomId);
  }

  updateParticipant(roomId: string, participantId: string, updates: Partial<Participant>): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const participantIndex = room.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return false;

    room.participants[participantIndex] = {
      ...room.participants[participantIndex],
      ...updates
    };

    this.persistRooms();
    return true;
  }

  removeParticipant(roomId: string, participantId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.participants = room.participants.filter(p => p.id !== participantId);
    this.persistRooms();
    return true;
  }

  private persistRooms(): void {
    try {
      const roomsArray = Array.from(this.rooms.entries());
      localStorage.setItem('mock-rooms', JSON.stringify(roomsArray));
    } catch (error) {
      console.error('Failed to persist rooms:', error);
    }
  }

  private loadRooms(): void {
    try {
      const stored = localStorage.getItem('mock-rooms');
      if (stored) {
        const roomsArray = JSON.parse(stored);
        this.rooms = new Map(roomsArray);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }

  constructor() {
    this.loadRooms();
  }
}

export const roomStorage = new RoomStorage();
export type { RoomData, Participant };
