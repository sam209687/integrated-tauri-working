// src/components/messages/MessageBubble.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { IMessage } from '@/lib/models/message';
import { Info } from 'lucide-react'; // Import an icon

interface MessageBubbleProps {
  // ✅ 1. Allow an optional 'isSystemMessage' property on the message object
  message: IMessage & { isSystemMessage?: boolean };
  isSender: boolean;
}

export function MessageBubble({ message, isSender }: MessageBubbleProps) {
  // ✅ 2. Check for the system message flag
  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center items-center my-2" key={message._id}>
        <div className="text-center text-xs font-semibold text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/50 rounded-full py-1.5 px-4 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  // ✅ 3. Render the normal chat bubble if it's not a system message
  return (
    <div
      className={cn(
        "flex",
        isSender ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "p-3 max-w-sm rounded-lg shadow-md wrap-break-words",
          isSender
            ? "bg-linear-to-br from-blue-500 to-blue-700 text-white rounded-br-none"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50 rounded-bl-none"
        )}
      >
        <p>{message.content}</p>
        <span className="text-xs mt-1 block opacity-70">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}