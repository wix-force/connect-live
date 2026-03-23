import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Loader2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { addMessage, clearUnread } from '@/store/slices/chatSlice';
import type { ChatMessage } from '@/store/slices/chatSlice';
import { useMeetingSocket } from '@/hooks/useSocket';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const messages = useAppSelector(s => s.chat.messages);
  const typingUsers = useAppSelector(s => s.chat.isTyping);
  const isLoadingHistory = useAppSelector(s => s.chat.isLoadingHistory);
  const user = useAppSelector(s => s.auth.user);
  const meetingId = useAppSelector(s => s.meeting.meetingId);
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sendChatMessage, sendTyping } = useMeetingSocket(meetingId);

  useEffect(() => {
    dispatch(clearUnread());
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, dispatch]);

  const send = () => {
    if (!input.trim()) return;

    // Add to local state immediately (optimistic)
    const msg: ChatMessage = {
      id: 'local-' + Date.now(),
      senderId: user?.id || '1',
      senderName: user?.name || 'You',
      content: input.trim(),
      timestamp: Date.now(),
      type: 'text',
    };
    dispatch(addMessage(msg));

    // Send via socket
    sendChatMessage(input.trim());
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping();
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">In-call messages</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoadingHistory && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Messages can only be seen by people in the call
          </p>
        )}
        {messages.map(m => {
          const isMe = m.senderId === (user?.id || '1');
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                {m.senderName[0]}
              </div>
              <div className={`max-w-[80%] ${isMe ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-foreground">{isMe ? 'You' : m.senderName}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(m.timestamp)}</span>
                </div>
                <div className={`inline-block rounded-xl px-3 py-2 text-sm ${
                  isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            {typingUsers.join(', ')} typing...
          </p>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-accent text-muted-foreground" aria-label="Emoji">
            <Smile className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Send a message..."
            className="flex-1 h-9 rounded-full bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Chat message"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
