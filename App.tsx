import React, { useState } from 'react';
import { Home } from './components/Home';
import { ChatRoom } from './components/ChatRoom';
import { ViewState } from './types';

function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  const handleJoinRoom = (roomId: string, user: string) => {
    setCurrentRoomId(roomId);
    setUsername(user);
    setView('CHAT');
  };

  const handleLeaveRoom = () => {
    // Optional: Clear room ID or keep it for easy rejoin
    setView('HOME');
    setCurrentRoomId('');
  };

  return (
    <div className="h-full">
      {view === 'HOME' ? (
        <Home onJoinRoom={handleJoinRoom} />
      ) : (
        <ChatRoom 
          roomId={currentRoomId} 
          username={username} 
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
