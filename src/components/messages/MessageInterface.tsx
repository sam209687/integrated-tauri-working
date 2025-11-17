"use client";

import React, { useEffect } from 'react';
import type { Session } from 'next-auth'; // Import the Session type
import { useMessageStore } from '@/store/message.store';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';

// This component now receives the user's session as a prop
interface MessageInterfaceProps {
  session: Session;
}

export function MessageInterface({ session }: MessageInterfaceProps) {
  const userId = session.user?.id;
  const userRole = session.user?.role;
  
  const { fetchConversations, fetchMessages, activeRecipientId, isLoading } = useMessageStore();

  // Determine the title based on the user's role from the session
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
      <div className="text-red-500 text-center h-full p-6">
        Authentication error. Please log in again.
      </div>
    );
  }
  
  // You can show a loading spinner from the store if needed
  if (isLoading) {
    // Optional: add a more integrated loading state here
  }

  return (
    <div className="flex flex-col h-full p-6 bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h1>
      <div className="flex flex-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <ConversationList />
        <ChatWindow />
      </div>
    </div>
  );
}