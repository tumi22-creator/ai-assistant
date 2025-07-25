// App.js
import React, { useState, useEffect } from 'react';
import './index.css';
import { FaRobot, FaMoon, FaSun, FaVolumeUp } from 'react-icons/fa';


function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI assistant. Ask me anything.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const utterance = new SpeechSynthesisUtterance(messages[messages.length - 1].content);
      speechSynthesis.speak(utterance);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const botMsg = {
        role: 'assistant',
        content: data.response || "Sorry, no response.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = {
        role: 'assistant',
        content: 'Error: Could not reach the server.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setInput('');
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSend();
    }
  };

  return (
    <div className={darkMode ? 'app dark' : 'app'}>
      <div className="max-w-3xl mx-auto mt-10 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-center">AI Assistant Chatbot</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="ml-4 px-3 py-1 border rounded text-sm"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <div className="flex flex-col gap-3 h-[70vh] overflow-y-auto p-4 border rounded bg-white dark:bg-gray-800 mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              {msg.role === 'assistant' && <FaRobot className="inline mr-2 text-blue-500" />}
              <span>{msg.content}</span>
              <div className="timestamp">{msg.timestamp.toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
