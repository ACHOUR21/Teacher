'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Send, Search, Plus, Users, Lock, Hash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
export default function MessagesPage() {
    const [selectedId, setSelectedId] = useState(null);
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const messagesEndRef = useRef(null);
    const qc = useQueryClient();
    const { socket } = useSocket({ namespace: '/messaging' });
    const currentUserId = useAuthStore(s => s.user?.id);
    const { data: conversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => api.get('/messaging/conversations').then(r => r.data.data),
    });
    const { data: messages, isLoading: messagesLoading } = useQuery({
        queryKey: ['messages', selectedId],
        queryFn: () => api.get(`/messaging/conversations/${selectedId}/messages`).then(r => r.data.data.data),
        enabled: !!selectedId,
    });
    const sendMutation = useMutation({
        mutationFn: (content) => api.post(`/messaging/conversations/${selectedId}/messages`, { content }),
        onSuccess: () => {
            setDraft('');
            qc.invalidateQueries({ queryKey: ['messages', selectedId] });
            qc.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
    useEffect(() => {
        if (!socket || !selectedId) {
            return;
        }
        socket.emit('join-conversation', { conversationId: selectedId });
        socket.on('new-message', (msg) => {
            qc.setQueryData(['messages', selectedId], (old = []) => [...old, msg]);
        });
        return () => {
            socket.emit('leave-conversation', { conversationId: selectedId });
            socket.off('new-message');
        };
    }, [socket, selectedId, qc]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const filteredConvos = (conversations ?? []).filter(c => {
        if (!search) {
            return true;
        }
        const name = c.name ?? c.participants.map(p => `${p.user.firstName} ${p.user.lastName}`).join(', ');
        return name.toLowerCase().includes(search.toLowerCase());
    });
    const selectedConvo = conversations?.find(c => c.id === selectedId);
    const convoName = selectedConvo?.name ?? selectedConvo?.participants.map(p => `${p.user.firstName} ${p.user.lastName}`).join(', ') ?? 'Chat';
    const handleSend = () => {
        if (!draft.trim() || !selectedId) {
            return;
        }
        sendMutation.mutate(draft.trim());
    };
    return (<div className="flex h-[calc(100vh-64px-48px)] -mx-6 -mt-6 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Messages</h2>
            <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
              <Plus className="h-4 w-4"/>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
            <input type="text" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-muted rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring"/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvos.length === 0 && (<div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
              <Hash className="h-8 w-8 text-muted-foreground/40"/>
              <p className="text-sm font-medium text-foreground">
                {search ? 'No results' : 'No conversations'}
              </p>
              <p className="text-xs text-muted-foreground">
                {search ? 'Try a different search term' : 'Start a new conversation using the + button above'}
              </p>
            </div>)}
          {filteredConvos.map(convo => {
            const name = convo.name ?? convo.participants.map(p => `${p.user.firstName} ${p.user.lastName}`).join(', ');
            const isSelected = convo.id === selectedId;
            return (<button key={convo.id} onClick={() => setSelectedId(convo.id)} className={cn('w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left', isSelected && 'bg-primary/10')}>
                <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0', convo.type === 'GROUP'
                    ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                    : 'bg-gradient-to-br from-blue-400 to-blue-600')}>
                  {convo.type === 'GROUP' ? <Users className="h-4 w-4"/> : name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm font-medium truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                      {name}
                    </p>
                    {convo.lastMessage && (<span className="text-xs text-muted-foreground flex-shrink-0 ml-1">
                        {formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: false })}
                      </span>)}
                  </div>
                  {convo.lastMessage && (<p className="text-xs text-muted-foreground truncate mt-0.5">{convo.lastMessage.content}</p>)}
                </div>
                {(convo.unreadCount ?? 0) > 0 && (<div className="h-4.5 min-w-[18px] bg-blue-600 rounded-full flex items-center justify-center px-1 flex-shrink-0">
                    <span className="text-white text-xs font-medium">{convo.unreadCount}</span>
                  </div>)}
              </button>);
        })}
        </div>
      </div>

      {/* Chat Area */}
      {!selectedId ? (<div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Hash className="h-8 w-8 text-primary/60"/>
            </div>
            <p className="text-foreground font-medium">Select a conversation</p>
            <p className="text-sm text-muted-foreground mt-1">Choose from the list to start messaging</p>
          </div>
        </div>) : (<div className="flex-1 flex flex-col bg-background">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold', selectedConvo?.type === 'GROUP'
                ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                : 'bg-gradient-to-br from-blue-400 to-blue-600')}>
              {selectedConvo?.type === 'GROUP' ? <Users className="h-4 w-4"/> : convoName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{convoName}</p>
              {selectedConvo?.type === 'GROUP' && (<p className="text-xs text-muted-foreground">{selectedConvo.participants.length} members</p>)}
            </div>
            {selectedConvo?.type === 'DIRECT' && (<Lock className="h-3.5 w-3.5 text-gray-300 ml-auto"/>)}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messagesLoading && (<div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (<div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                    {i % 2 === 0 && <div className="h-7 w-7 bg-gray-100 rounded-full animate-pulse"/>}
                    <div className={cn('h-10 rounded-xl animate-pulse', i % 2 === 0 ? 'bg-gray-100 w-48' : 'bg-blue-100 w-36')}/>
                  </div>))}
              </div>)}
            {(messages ?? []).map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                return (<div key={msg.id} className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                  {!isOwn && (<div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {msg.sender?.firstName?.[0]}{msg.sender?.lastName?.[0]}
                    </div>)}
                  <div className={cn('max-w-[70%] rounded-2xl px-4 py-2.5', isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm')}>
                    {!isOwn && (<p className={cn('text-xs font-medium mb-0.5', isOwn ? 'text-blue-200' : 'text-blue-600')}>
                        {msg.sender?.firstName} {msg.sender?.lastName}
                      </p>)}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={cn('text-xs mt-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>);
            })}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2">
              <input type="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Type a message..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"/>
              <button onClick={handleSend} disabled={!draft.trim() || sendMutation.isPending} className={cn('p-1.5 rounded-xl transition-colors', draft.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground')}>
                <Send className="h-4 w-4"/>
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
