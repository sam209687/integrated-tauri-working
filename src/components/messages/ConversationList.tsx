// ============================================================================
// FILE 2: src/components/messages/ConversationList.tsx
// ============================================================================
import React from 'react';
import { Mail, Loader2, User, MessageCircle } from 'lucide-react';
import { useMessageStore } from '@/store/message.store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversationList() {
  const { conversations, isLoading, activeRecipientId, setActiveRecipient } = useMessageStore();

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-linear-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Chats</h2>
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {isLoading && conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 flex flex-col items-center justify-center"
          >
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Loading chats...</p>
          </motion.div>
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center"
          >
            <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No conversations yet</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {conversations.map((conv, index) => (
              <motion.div
                key={conv.user._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveRecipient(conv.user._id)}
                className={cn(
                  "relative p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-gray-700",
                  activeRecipientId === conv.user._id
                    ? "bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-l-blue-500"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
              >
                {/* Avatar */}
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {conv.user.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-800 dark:text-white truncate">
                        {conv.user.name}
                        {conv.user.storeLocation && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({conv.user.storeLocation})
                          </span>
                        )}
                      </p>
                      {conv.unreadCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2"
                        >
                          <span className="bg-linear-to-br from-red-500 to-pink-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                            {conv.unreadCount}
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {conv.user.role}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </ScrollArea>
    </div>
  );
}