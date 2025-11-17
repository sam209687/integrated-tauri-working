// src/components/messages/ChatWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useMessageStore } from '@/store/message.store';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';

export function ChatWindow() {
  const { user } = useAuth();
  const userId = user?._id;
  
  const { messages, activeRecipient, activeRecipientId, sendMessage } = useMessageStore();
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageContent.trim() && userId && activeRecipientId) {
      sendMessage(userId, activeRecipientId, messageContent);
      setMessageContent('');
    }
  };

  if (!activeRecipient) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-r-lg shadow-md">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Select a user to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-r-lg shadow-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">{activeRecipient.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chatting with {activeRecipient.role}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg._id} 
              message={msg} 
              isSender={msg.sender.toString() === userId} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
        <Input
          placeholder="Type a message..."
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1"
        />
        <Button onClick={handleSendMessage}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}