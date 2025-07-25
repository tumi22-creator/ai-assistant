import React from 'react';

const ChatWindow = ({ messages }) => {
  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto h-[70vh] bg-gray-50 rounded shadow">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`p-2 rounded max-w-[70%] ${
            msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'
          }`}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
};

export default ChatWindow;
