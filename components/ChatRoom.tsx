import React, { useEffect, useState, useRef } from 'react';
import { Send, ArrowLeft, Copy, Check } from 'lucide-react';
import { sendMessage, subscribeToMessages } from '../services/firebase';
import { ChatMessage } from '../types';

interface ChatRoomProps {
  roomId: string;
  username: string;
  onLeave: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, username, onLeave }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to realtime messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(roomId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      await sendMessage(roomId, username, inputText.trim());
      setInputText('');
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const copyRoomId = async () => {
    try {
      // Try modern API
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
    } catch (err) {
      // Fallback for non-secure contexts (http)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = roomId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
      } catch (fallbackErr) {
        alert(`Could not auto-copy. Room ID is: ${roomId}`);
      }
    }
    
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center">
          <button 
            onClick={onLeave}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="ml-2">
            <h2 className="text-lg font-bold text-slate-800">Room Chat</h2>
            <div className="flex items-center text-xs text-slate-500 space-x-2 mt-0.5">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ID: {roomId}</span>
              <button 
                onClick={copyRoomId}
                className="hover:text-indigo-600 transition p-1"
                title="Copy Room ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
          {username}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
             <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-2">
               <Send className="w-10 h-10 text-slate-400 ml-1" />
             </div>
             <p className="font-medium">No messages yet.</p>
             <p className="text-sm bg-white px-3 py-1 rounded-full shadow-sm">
               Invite friend with Room ID: <span className="font-mono font-bold select-all">{roomId}</span>
             </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.username === username;
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[80%] md:max-w-[60%] lg:max-w-[50%] 
                    rounded-2xl px-4 py-2 shadow-sm relative group
                    ${isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                    }
                  `}
                >
                  {!isMe && (
                    <p className="text-[10px] font-bold text-indigo-600 mb-1 opacity-80">
                      {msg.username}
                    </p>
                  )}
                  <p className="text-sm md:text-base break-words leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <p className={`
                    text-[10px] text-right mt-1
                    ${isMe ? 'text-indigo-200' : 'text-slate-400'}
                  `}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-3 sticky bottom-0 safe-area-bottom">
        <form 
          onSubmit={handleSend}
          className="max-w-4xl mx-auto flex items-end space-x-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 px-3 py-2.5 max-h-32 overflow-y-auto"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className={`
              p-3 rounded-xl flex-shrink-0 transition-all duration-200 flex items-center justify-center
              ${inputText.trim() 
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
};