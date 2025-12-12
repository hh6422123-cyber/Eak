export interface ChatMessage {
  id: string;
  text: string;
  username: string;
  timestamp: number;
}

export interface RoomData {
  createdAt: number;
  messages?: Record<string, ChatMessage>;
}

export type ViewState = 'HOME' | 'CHAT';
