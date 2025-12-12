import React, { useState, useRef } from 'react';
import { MessageSquare, Plus, ArrowRight, User } from 'lucide-react';
import { createRoom, checkRoomExists } from '../services/firebase';

interface HomeProps {
  onJoinRoom: (roomId: string, username: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onJoinRoom }) => {
  const [username, setUsername] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const validateUsername = () => {
    if (!username.trim()) {
      setError("Please enter a username to start chatting.");
      usernameInputRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleCreateRoom = async () => {
    if (!validateUsername()) return;

    setLoading(true);
    setError(null);
    
    try {
      // Generate a 6-digit random number string
      let newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Ensure uniqueness (simple retry logic)
      let exists = await checkRoomExists(newRoomId);
      let attempts = 0;
      while (exists && attempts < 3) {
         newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
         exists = await checkRoomExists(newRoomId);
         attempts++;
      }

      if (exists) {
        throw new Error("Could not generate a unique room ID. Please try again.");
      }

      const success = await createRoom(newRoomId);
      
      if (success) {
        onJoinRoom(newRoomId, username);
      } else {
        setError("Failed to create room. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUsername()) return;
    
    if (!joinRoomId.trim()) {
      setError("Please enter a room ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const exists = await checkRoomExists(joinRoomId.trim());
      if (exists) {
        onJoinRoom(joinRoomId.trim(), username);
      } else {
        setError("Room not found. Please check the ID.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        
        <div className="flex items-center justify-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold ml-4 text-slate-800">FireChat</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
              <User className="w-4 h-4 mr-1 text-slate-400" />
              Choose your username <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              ref={usernameInputRef}
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error?.includes("username")) setError(null);
              }}
              placeholder="e.g. Alice"
              className={`w-full px-4 py-3 rounded-lg border transition outline-none ${
                error?.includes("username") 
                  ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50' 
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="group flex items-center justify-center w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              {loading ? 'Creating...' : 'Create New Room'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Join existing room
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Enter Room ID (e.g. 123456)"
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className={`mt-6 p-4 text-sm rounded-lg flex items-center animate-pulse ${
            error.includes("username") ? "bg-red-50 text-red-600" : "bg-red-50 text-red-600"
          }`}>
             <span className="font-medium mr-1">Error:</span> {error}
          </div>
        )}
      </div>
    </div>
  );
};