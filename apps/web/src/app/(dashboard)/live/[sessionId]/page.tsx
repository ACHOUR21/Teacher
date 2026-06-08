'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare,
  Hand, Share2, PenLine, Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LiveWhiteboard } from '@/components/live/LiveWhiteboard';
import { cn } from '@/lib/utils';

// ------------------------------------------------------------------ types

interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string;
}

interface Participant {
  userId: string;
  socketId?: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
  role: string;
}

// ------------------------------------------------------------------ VideoTile

const VideoTile = memo(function VideoTile({
  stream,
  name,
  muted = false,
}: {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="aspect-video bg-gray-700 rounded-xl relative overflow-hidden">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
            {name[0]?.toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2">
        <span className="text-white text-xs bg-black/50 px-2 py-0.5 rounded truncate max-w-[150px] block">
          {name}
        </span>
      </div>
    </div>
  );
});

// ------------------------------------------------------------------ page

type SidePanel = 'chat' | 'whiteboard' | 'participants';

export default function LiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { socket, isConnected } = useSocket({ namespace: '/live' });

  const {
    localStream,
    remoteStreams,
    callPeer,
    setMicEnabled,
    setCameraEnabled,
  } = useWebRTC(socket);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel | null>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: session } = useQuery({
    queryKey: ['live-session', sessionId],
    queryFn: () => api.get(`/live/sessions/${sessionId}`).then(r => r.data.data),
  });

  // ------------------------------------------------------------------ socket setup

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('join-session', { sessionId }, (response: any) => {
      if (response?.participants) setParticipants(response.participants);
    });

    socket.on('participant-joined', (data: any) => {
      setParticipants(prev => [...prev, data]);
      // Initiate WebRTC offer to the new peer
      if (data.socketId) callPeer(data.socketId);
    });

    socket.on('participant-left', (data: any) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    });

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('mic-toggled', (data: any) => {
      setParticipants(prev =>
        prev.map(p => (p.userId === data.userId ? { ...p, micOn: data.enabled } : p)),
      );
    });

    return () => {
      socket.emit('leave-session');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('new-message');
      socket.off('mic-toggled');
    };
    // callPeer is stable (useCallback), safe to include
  }, [socket, isConnected, sessionId, callPeer]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ------------------------------------------------------------------ controls

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    setMicEnabled(next);
    socket?.emit('toggle-mic', { enabled: next });
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    setCameraEnabled(next);
    socket?.emit('toggle-camera', { enabled: next });
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    socket?.emit('raise-hand', { raised: next });
  };

  const startScreenShare = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      socket?.emit('screen-share', { sharing: true });
      screen.getVideoTracks()[0].onended = () => {
        socket?.emit('screen-share', { sharing: false });
      };
    } catch {
      // user cancelled or denied
    }
  };

  const leaveSession = () => {
    socket?.emit('leave-session');
    router.push('/live');
  };

  const togglePanel = (panel: SidePanel) => {
    setSidePanel(prev => (prev === panel ? null : panel));
  };

  // ------------------------------------------------------------------ render helpers

  const allTiles = [
    // self tile — always first
    <VideoTile key="self" stream={localStream} name="You (me)" muted />,
    // remote peers
    ...participants.slice(0, 7).map(p => (
      <VideoTile
        key={p.userId}
        stream={remoteStreams.get(p.socketId ?? '') ?? null}
        name={`${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`.trim() || 'Participant'}
      />
    )),
  ];

  // ------------------------------------------------------------------ JSX

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-900 -mx-6 -mt-6 overflow-hidden">
      {/* ---- Main area ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-white font-medium text-sm">{session?.title ?? 'Live Session'}</p>
            <p className="text-gray-400 text-xs flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Live · {participants.length + 1} participants
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'chat' as SidePanel,         icon: MessageSquare, title: 'Chat'         },
                { id: 'whiteboard' as SidePanel,   icon: PenLine,       title: 'Whiteboard'  },
                { id: 'participants' as SidePanel, icon: Users,         title: 'Participants' },
              ] as const
            ).map(({ id, icon: Icon, title }) => (
              <button
                key={id}
                onClick={() => togglePanel(id)}
                title={title}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  sidePanel === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Video grid */}
        <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start auto-rows-max overflow-y-auto">
          {allTiles}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4 flex-shrink-0">
          <button
            onClick={toggleMic}
            title={micOn ? 'Mute' : 'Unmute'}
            className={cn(
              'p-3 rounded-full transition-colors',
              micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white',
            )}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleCamera}
            title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
            className={cn(
              'p-3 rounded-full transition-colors',
              cameraOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white',
            )}
          >
            {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleHand}
            title={handRaised ? 'Lower hand' : 'Raise hand'}
            className={cn(
              'p-3 rounded-full transition-colors',
              handRaised ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600',
            )}
          >
            <Hand className="h-5 w-5" />
          </button>
          <button
            onClick={startScreenShare}
            title="Share screen"
            className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={leaveSession}
            className="px-5 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="text-sm font-medium">Leave</span>
          </button>
        </div>
      </div>

      {/* ---- Side panel ---- */}
      {sidePanel && (
        <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700 flex-shrink-0">
          {/* Chat */}
          {sidePanel === 'chat' && (
            <>
              <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
                <p className="text-white font-medium text-sm">Live Chat</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-xs text-center mt-8">No messages yet</p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-blue-400 text-xs font-medium">{msg.userId}</p>
                    <p className="text-gray-200 mt-0.5 break-words">{msg.message}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-gray-700 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (!chatInput.trim()) return;
                      socket?.emit('send-message', { message: chatInput });
                      setChatInput('');
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
                <button
                  onClick={() => {
                    if (!chatInput.trim()) return;
                    socket?.emit('send-message', { message: chatInput });
                    setChatInput('');
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </>
          )}

          {/* Whiteboard */}
          {sidePanel === 'whiteboard' && (
            <LiveWhiteboard socket={socket} className="flex-1" />
          )}

          {/* Participants */}
          {sidePanel === 'participants' && (
            <>
              <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
                <p className="text-white font-medium text-sm">
                  Participants <span className="text-gray-400">({participants.length + 1})</span>
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Self */}
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    Y
                  </div>
                  <p className="text-white text-sm flex-1">You (me)</p>
                  <div className="flex items-center gap-1">
                    {!micOn && <MicOff className="h-3.5 w-3.5 text-red-400" />}
                    {!cameraOn && <VideoOff className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                </div>
                {participants.map(p => (
                  <div key={p.userId} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-700">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {p.user?.firstName?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-gray-200 text-sm flex-1 truncate">
                      {p.user?.firstName} {p.user?.lastName}
                    </p>
                    <span className="text-xs text-gray-500">{p.role}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
