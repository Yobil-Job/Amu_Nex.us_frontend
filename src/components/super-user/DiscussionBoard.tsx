import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import EmptyState from '@/components/admin/EmptyState';

interface DiscussionBoardProps {
  clubId: number;
}

// Client-side storage for discussion messages (mock)
const STORAGE_KEY = 'discussion_messages';

export const saveDiscussionMessage = (message: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allMessages = stored ? JSON.parse(stored) : [];
    allMessages.push({
      ...message,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMessages));
  } catch (error) {
    console.error('Failed to save discussion message:', error);
  }
};

export const loadDiscussionMessages = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allMessages = JSON.parse(stored);
    return allMessages
      .filter((m: any) => m.clubId === clubId)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });
  } catch {
    return [];
  }
};

const DiscussionBoard = ({ clubId }: DiscussionBoardProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [clubId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = () => {
    const loadedMessages = loadDiscussionMessages(clubId);
    setMessages(loadedMessages);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    try {
      saveDiscussionMessage({
        clubId,
        userId: user.id,
        userName: `${user.firstname} ${user.lastname}`,
        userEmail: user.email,
        message: newMessage.trim(),
      });

      setNewMessage('');
      loadMessages();
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Discussion Board
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Internal chat for club authorities
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto pr-4 mb-4">
            {messages.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No Messages"
                description="Start a discussion by sending the first message"
              />
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.userId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-primary/20 text-white'
                            : 'bg-muted/50 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">
                            {message.userName || 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message... (Press Enter to send)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="glass-card border-primary/20 flex-1 min-h-[80px] resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSubmitting || !newMessage.trim()}
              className="gap-2 purple-gold-gradient"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscussionBoard;

