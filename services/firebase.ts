import { ChatMessage } from '../types';

// NOTE: using LocalStorage to simulate backend
const STORAGE_KEY = 'firechat_rooms';

const getRooms = (): Record<string, any> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Storage read error", e);
    return {};
  }
};

const saveRooms = (rooms: Record<string, any>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch (e) {
    console.error("Storage save error", e);
    alert("Local storage is full or disabled. Chat may not save.");
  }
};

// Services

/**
 * Creates a new room with a given ID.
 * Returns true if successful.
 */
export const createRoom = async (roomId: string): Promise<boolean> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  const rooms = getRooms();
  if (rooms[roomId]) {
    return false; // Collision
  }
  
  rooms[roomId] = {
    createdAt: Date.now(),
    messages: {}
  };
  
  saveRooms(rooms);
  return true;
};

/**
 * Checks if a room exists.
 */
export const checkRoomExists = async (roomId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const rooms = getRooms();
  return !!rooms[roomId];
};

/**
 * Sends a message to a specific room.
 */
export const sendMessage = async (roomId: string, username: string, text: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const rooms = getRooms();
  
  if (!rooms[roomId]) return;

  const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const newMessage = {
    id: messageId,
    username,
    text,
    timestamp: Date.now()
  };

  if (!rooms[roomId].messages) {
    rooms[roomId].messages = {};
  }

  rooms[roomId].messages[messageId] = newMessage;
  saveRooms(rooms);
};

/**
 * Subscribes to messages in a room.
 * Returns the unsubscribe function.
 */
export const subscribeToMessages = (
  roomId: string, 
  callback: (messages: ChatMessage[]) => void
) => {
  let active = true;

  const checkMessages = () => {
    if (!active) return;
    const rooms = getRooms();
    const room = rooms[roomId];
    
    if (room && room.messages) {
      const messageList = Object.values(room.messages) as ChatMessage[];
      messageList.sort((a, b) => a.timestamp - b.timestamp);
      callback(messageList);
    } else {
      callback([]);
    }
  };

  // Initial check
  checkMessages();

  // Poll for updates (faster polling for smoother feel)
  const interval = setInterval(checkMessages, 500);

  // Listen for storage events (updates from other tabs)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      checkMessages();
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    active = false;
    clearInterval(interval);
    window.removeEventListener('storage', handleStorage);
  };
};