// ============================================================================
// FILE 3: src/components/messages/ChatWindow.tsx
// ============================================================================
import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Phone, Video, Smile, MessageCircle } from 'lucide-react';
import { useMessageStore } from '@/store/message.store';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex-1 flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto mb-6 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
            <MessageCircle className="h-16 w-16 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a contact to start messaging
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {activeRecipient.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            </div>
            
            {/* Name & Status */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {activeRecipient.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online • {activeRecipient.role}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <MessageBubble 
                key={msg._id} 
                message={msg} 
                isSender={msg.sender.toString() === userId}
                index={index}
              />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 backdrop-blur-lg"
      >
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
          >
            <Smile className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
          
          <Input
            placeholder="Type a message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1 border-gray-300 dark:border-gray-600 rounded-full px-6 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          />
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleSendMessage}
              disabled={!messageContent.trim()}
              className="rounded-full bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}