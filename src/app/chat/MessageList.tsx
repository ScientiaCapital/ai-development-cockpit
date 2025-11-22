import React from 'react';
import { Message } from './ChatInterface';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4 mb-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-100 ml-12'
              : 'bg-gray-100 mr-12'
          }`}
        >
          <div className="font-semibold mb-1">
            {message.role === 'user' ? 'You' : 'Claude'}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
