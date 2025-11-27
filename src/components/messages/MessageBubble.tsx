// ============================================================================
// FILE 4: src/components/messages/MessageBubble.tsx
// ============================================================================
import React from 'react';
import { cn } from '@/lib/utils';
import { IMessage } from '@/lib/models/message';
import { Info, Check, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: IMessage & { isSystemMessage?: boolean };
  isSender: boolean;
  index?: number;
}

export function MessageBubble({ message, isSender, index = 0 }: MessageBubbleProps) {
  // System Message
  if (message.isSystemMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex justify-center my-4"
      >
        <div className="text-center text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/30 rounded-full py-2 px-4 flex items-center gap-2 shadow-sm border border-amber-200 dark:border-amber-800">
          <Info className="h-3.5 w-3.5" />
          <span>{message.content}</span>
        </div>
      </motion.div>
    );
  }

  // Regular Message
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
      className={cn(
        "flex",
        isSender ? "justify-end" : "justify-start"
      )}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn(
          "relative max-w-md px-4 py-2 rounded-2xl shadow-lg",
          isSender
            ? "bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 rounded-bl-md border border-gray-200 dark:border-gray-600"
        )}
      >
        {/* Message Content */}
        <p className="text-sm leading-relaxed wrap-break-words">{message.content}</p>
        
        {/* Timestamp & Status */}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isSender ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-xs",
            isSender ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          )}>
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          {/* Read status (for sender only) */}
          {isSender && (
            <CheckCheck className="h-3.5 w-3.5 text-blue-100" />
          )}
        </div>

        {/* Tail */}
        <div className={cn(
          "absolute bottom-0 w-3 h-3",
          isSender
            ? "right-0 -mr-1 bg-linear-to-br from-blue-500 to-blue-600"
            : "left-0 -ml-1 bg-white dark:bg-gray-700 border-l border-b border-gray-200 dark:border-gray-600"
        )} 
        style={{
          clipPath: isSender 
            ? 'polygon(0 0, 100% 0, 0 100%)' 
            : 'polygon(100% 0, 100% 100%, 0 0)'
        }}
        />
      </motion.div>
    </motion.div>
  );
}