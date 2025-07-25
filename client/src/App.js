import React, { useState } from 'react';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI assistant. Ask me anything." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const botMsg = { role: 'assistant', content: data.response || "Sorry, no response." };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = { role: 'assistant', content: 'Error: Could not reach the server.' };
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
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">AI Assistant Chatbot</h1>

      <div className="flex flex-col gap-3 h-[70vh] overflow-y-auto p-4 border rounded bg-gray-50 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[70%] p-3 rounded ${
              msg.role === 'user' ? 'bg-blue-200 self-end' : 'bg-gray-200 self-start'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border border-gray-400 rounded"
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
  );
}

export default App;
