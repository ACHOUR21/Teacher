'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, Hand, Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string;
}

interface Participant {
  userId: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
  role: string;
}

export default function LiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { socket, isConnected } = useSocket({ namespace: '/live' });

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: session } = useQuery({
    queryKey: ['live-session', sessionId],
    queryFn: () => api.get(`/live/sessions/${sessionId}`).then(r => r.data.data),
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('join-session', { sessionId }, (response: any) => {
      if (response?.participants) setParticipants(response.participants);
    });

    socket.on('participant-joined', (data: any) => {
      setParticipants(prev => [...prev, data]);
    });

    socket.on('participant-left', (data: any) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    });

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('mic-toggled', (data: any) => {
      setParticipants(prev => prev.map(p => p.userId === data.userId ? { ...p, micOn: data.enabled } : p));
    });

    return () => {
      socket.emit('leave-session');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('new-message');
      socket.off('mic-toggled');
    };
  }, [socket, isConnected, sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMic = () => {
    const newState = !micOn;
    setMicOn(newState);
    socket?.emit('toggle-mic', { enabled: newState });
  };

  const toggleCamera = () => {
    const newState = !cameraOn;
    setCameraOn(newState);
    socket?.emit('toggle-camera', { enabled: newState });
  };

  const toggleHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    socket?.emit('raise-hand', { raised: newState });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socket?.emit('send-message', { message: chatInput });
    setChatInput('');
  };

  const leaveSession = () => {
    socket?.emit('leave-session');
    router.push('/live');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-900 -mx-6 -mt-6">
      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Session Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">{session?.title ?? 'Live Session'}</p>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Live · {participants.length} participants
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChat(s => !s)} className={cn('p-2 rounded-lg transition-colors', showChat ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700')}>
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start auto-rows-max">
          {participants.slice(0, 8).map((p, i) => (
            <div key={p.userId ?? i} className="aspect-video bg-gray-700 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-white text-xs bg-black/50 px-2 py-0.5 rounded truncate max-w-[80%]">
                  {p.user?.firstName} {p.user?.lastName}
                </span>
              </div>
            </div>
          ))}
          {/* Self tile */}
          <div className="aspect-video bg-gray-600 rounded-xl flex items-center justify-center relative border-2 border-blue-500">
            <div className="text-gray-400 text-sm">You</div>
            {!cameraOn && <div className="absolute inset-0 bg-gray-800 rounded-xl flex items-center justify-center"><VideoOff className="h-6 w-6 text-gray-400" /></div>}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
          <button onClick={toggleMic} className={cn('p-3 rounded-full transition-colors', micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white')}>
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          <button onClick={toggleCamera} className={cn('p-3 rounded-full transition-colors', cameraOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white')}>
            {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          <button onClick={toggleHand} className={cn('p-3 rounded-full transition-colors', handRaised ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600')}>
            <Hand className="h-5 w-5" />
          </button>
          <button className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
          <button onClick={leaveSession} className="px-5 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2">
            <PhoneOff className="h-5 w-5" />
            <span className="text-sm font-medium">Leave</span>
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-72 bg-gray-800 flex flex-col border-l border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-white font-medium text-sm">Live Chat</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <p className="text-blue-400 text-xs font-medium">{msg.userId}</p>
                <p className="text-gray-200 mt-0.5">{msg.message}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
            />
            <button onClick={sendMessage} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
