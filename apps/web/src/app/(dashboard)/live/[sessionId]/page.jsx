'use client';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
const REACTIONS = ['👍', '👎', '❤️', '😂', '😮', '👏'];
export default function LiveClassroomPage() {
    const params = useParams();
    const sessionId = params.sessionId;
    const [jitsiUrl, setJitsiUrl] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [handRaised, setHandRaised] = useState(false);
    const [activePoll, setActivePoll] = useState(null);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const socketRef = useRef(null);
    const chatEndRef = useRef(null);
    useEffect(() => {
        const token = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('eduai-auth') ?? '{}')?.accessToken
            : null;
        // Fetch Jitsi join token
        if (token) {
            fetch(`/api/live/sessions/${sessionId}/join-token`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((r) => r.json())
                .then((d) => {
                if (d.jitsiUrl)
                    {setJitsiUrl(d.jitsiUrl);}
            })
                .catch(() => null);
        }
        // Connect Socket.IO
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const socket = io(`${apiUrl}/live`, { auth: { token } });
        socketRef.current = socket;
        socket.on('connect', () => {
            socket.emit('join-session', { sessionId, token });
        });
        socket.on('participant-list', (list) => setParticipants(list));
        socket.on('hand-raised', (data) => {
            setParticipants((prev) => prev.map((p) => p.userId === data.userId ? { ...p, handRaised: data.raised } : p));
        });
        socket.on('chat-message', (msg) => setMessages((prev) => [...prev, msg]));
        socket.on('poll-created', (poll) => setActivePoll(poll));
        socket.on('poll-updated', (poll) => setActivePoll(poll));
        socket.on('reaction', (data) => {
            const id = Math.random().toString(36).slice(2);
            setFloatingReactions((prev) => [...prev, { id, emoji: data.emoji }]);
            setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 2500);
        });
        return () => { socket.emit('leave-session', { sessionId }); socket.disconnect(); };
    }, [sessionId]);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const sendChat = () => {
        if (!chatInput.trim())
            {return;}
        socketRef.current?.emit('chat-message', { sessionId, message: chatInput.trim() });
        setChatInput('');
    };
    const toggleHand = () => {
        const next = !handRaised;
        setHandRaised(next);
        socketRef.current?.emit('hand-raise', { sessionId, raised: next });
    };
    const sendReaction = (emoji) => {
        socketRef.current?.emit('reaction', { sessionId, emoji });
    };
    const votePoll = (pollId, optionIndex) => {
        socketRef.current?.emit('poll-vote', { sessionId, pollId, optionIndex });
    };
    return (<div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Video area */}
      <div className="flex-1 relative">
        {jitsiUrl ? (<iframe src={jitsiUrl} className="w-full h-full border-0" allow="camera; microphone; fullscreen; display-capture" title="Live classroom"/>) : (<div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"/>
              <p className="text-gray-400">Connecting to classroom…</p>
            </div>
          </div>)}

        {/* Floating reactions */}
        <div className="absolute bottom-20 left-4 pointer-events-none">
          {floatingReactions.map((r) => (<div key={r.id} className="text-3xl animate-bounce mb-1">{r.emoji}</div>))}
        </div>

        {/* Reaction bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800/80 backdrop-blur rounded-full px-4 py-2">
          {REACTIONS.map((emoji) => (<button key={emoji} onClick={() => sendReaction(emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>))}
          <button onClick={toggleHand} className={`ml-3 px-3 py-1 rounded-full text-sm font-medium transition-colors ${handRaised ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white hover:bg-gray-500'}`}>
            {handRaised ? '✋ Lower hand' : '✋ Raise hand'}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col border-l border-gray-700 bg-gray-800">
        {/* Participants */}
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Participants ({participants.length})
          </h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {participants.map((p) => (<div key={p.userId} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs">
                  {p.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate">{p.displayName}</span>
                {p.handRaised && <span title="Hand raised">✋</span>}
              </div>))}
          </div>
        </div>

        {/* Active poll */}
        {activePoll && (<div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Poll</h3>
            <p className="text-sm mb-2">{activePoll.question}</p>
            {activePoll.options.map((opt, i) => (<button key={i} onClick={() => votePoll(activePoll.id, i)} className="w-full text-left text-sm mb-1 p-2 rounded bg-gray-700 hover:bg-indigo-600 transition-colors">
                <span>{opt.text}</span>
                <span className="float-right text-xs text-gray-400">{opt.votes} votes</span>
              </button>))}
          </div>)}

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300">Chat</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (<div key={i} className="text-sm">
                <span className="font-medium text-indigo-400">{msg.userId.slice(0, 8)}: </span>
                <span className="text-gray-200">{msg.message}</span>
              </div>))}
            <div ref={chatEndRef}/>
          </div>
          <div className="p-3 border-t border-gray-700 flex gap-2">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter')
        {sendChat();} }} placeholder="Type a message…" className="flex-1 bg-gray-700 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"/>
            <button onClick={sendChat} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-sm font-medium">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>);
}
