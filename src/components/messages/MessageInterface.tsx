// ============================================================================
// FILE 1: src/components/messages/MessageInterface.tsx
// ============================================================================
"use client";

import React, { useEffect } from 'react';
import type { Session } from 'next-auth';
import { useMessageStore } from '@/store/message.store';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface MessageInterfaceProps {
  session: Session;
}

export function MessageInterface({ session }: MessageInterfaceProps) {
  const userId = session.user?.id;
  const userRole = session.user?.role;
  
  const { fetchConversations, fetchMessages, activeRecipientId } = useMessageStore();

  const title = userRole === 'admin' ? 'Admin Messages' : 'Messages';

  useEffect(() => {
    if (userId) {
      fetchConversations(userId);
    }
  }, [userId, fetchConversations]);

  useEffect(() => {
    if (userId && activeRecipientId) {
      fetchMessages(userId, activeRecipientId);
    }
  }, [userId, activeRecipientId, fetchMessages]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-red-500 text-lg font-semibold">
            Authentication error. Please log in again.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
      </motion.div>

      {/* Main Chat Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex h-[calc(100vh-120px)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg border border-gray-200 dark:border-gray-700"
      >
        <ConversationList />
        <ChatWindow />
      </motion.div>
    </div>
  );
}