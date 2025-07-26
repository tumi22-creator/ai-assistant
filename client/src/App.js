import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const PERSONALITIES = {
  tutor: "You are a friendly tutor, helpful and kind.",
  formal: "You are a formal assistant, professional and polite.",
  tech: "You are a tech expert, very technical and detailed."
};

const CHAT_CATEGORIES = [
  { id: "general", label: "General Q&A" },
  { id: "code", label: "Code Help" },
  { id: "life", label: "Life Advice" },
  { id: "jokes", label: "Jokes" },
];

function App() {
  // Active chat category ID
  const [activeCategory, setActiveCategory] = useState("general");

  // Chats stored by category (persistent in localStorage)
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("chats");
    return saved ? JSON.parse(saved) : {
      general: [{ role: 'assistant', content: "Hi! I'm your AI assistant. Ask me anything." }],
      code: [],
      life: [],
      jokes: []
    };
  });

  // Input & loading state
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Personality
  const [personality, setPersonality] = useState("tutor");

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Voice recognition ref
  const recognition = useRef(null);

  // Typing animation state
  const [typing, setTyping] = useState(false);

  // Scroll ref for chat container
  const chatContainerRef = useRef(null);

  // Save chats to localStorage on change
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // Scroll chat to bottom on new message or typing
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats, typing]);

  // Voice input setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      recognition.current = null;
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.lang = 'en-US';
    recognition.current.interimResults = false;
    recognition.current.maxAlternatives = 1;

    recognition.current.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setInput(speechResult);
    };

    recognition.current.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };
  }, []);

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Check for chat commands first
    if (input.startsWith("/reminder ")) {
      const reminder = input.slice(10).trim();
      localStorage.setItem("reminder", reminder);
      setChats((prev) => {
        const updated = {...prev};
        updated[activeCategory].push({ role: "assistant", content: `Reminder set: "${reminder}"` });
        return updated;
      });
      setInput("");
      return;
    }
    if (input.startsWith("/todo ")) {
      const todo = input.slice(6).trim();
      const todos = JSON.parse(localStorage.getItem("todos") || "[]");
      todos.push(todo);
      localStorage.setItem("todos", JSON.stringify(todos));
      setChats((prev) => {
        const updated = {...prev};
        updated[activeCategory].push({ role: "assistant", content: `Todo added: "${todo}"` });
        return updated;
      });
      setInput("");
      return;
    }

    // Add user message
    const userMsg = { role: "user", content: input };
    setChats((prev) => {
      const updated = {...prev};
      updated[activeCategory] = [...updated[activeCategory], userMsg];
      return updated;
    });
    setLoading(true);
    setTyping(true);
    setInput("");

    try {
      // Call your backend API here with personality included
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, personality: PERSONALITIES[personality] }),
      });
      const data = await response.json();

      // Simulate typing delay
      setTimeout(() => {
        setChats((prev) => {
          const updated = {...prev};
          updated[activeCategory].push({ role: "assistant", content: data.response || "Sorry, no response." });
          return updated;
        });
        setTyping(false);
        setLoading(false);
      }, 1500);
    } catch (error) {
      setChats((prev) => {
        const updated = {...prev};
        updated[activeCategory].push({ role: "assistant", content: "Error: Could not reach the server." });
        return updated;
      });
      setTyping(false);
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  // Start voice recognition
  const startVoice = () => {
    if (recognition.current) {
      recognition.current.start();
    }
  };

  // Export chat to TXT
  const exportTxt = () => {
    const text = chats[activeCategory].map(m => `${m.role === "user" ? "You" : "Assistant"}: ${m.content}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeCategory}-chat.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy chat to clipboard
  const copyChat = async () => {
    const text = chats[activeCategory].map(m => `${m.role === "user" ? "You" : "Assistant"}: ${m.content}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      alert("Chat copied to clipboard!");
    } catch {
      alert("Failed to copy chat.");
    }
  };

  // Filtered messages by search
  const filteredMessages = chats[activeCategory].filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar: categories */}
      <aside className="w-48 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col space-y-2">
        <h2 className="font-bold mb-2">Chat Categories</h2>
        {CHAT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`py-2 px-3 rounded text-left hover:bg-blue-500 hover:text-white transition ${
              activeCategory === cat.id ? "bg-blue-600 text-white" : ""
            }`}
          >
            {cat.label}
          </button>
        ))}

        <hr className="my-4 border-gray-400" />

        {/* Personality switch */}
        <h3 className="font-bold mb-2">Assistant Personality</h3>
        <select
          className="p-2 rounded bg-white dark:bg-gray-700 dark:text-gray-100"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
        >
          <option value="tutor">🤓 Friendly Tutor</option>
          <option value="formal">💼 Formal Assistant</option>
          <option value="tech">🤖 Tech Expert</option>
        </select>

        {/* Voice input */}
        <button
          onClick={startVoice}
          className="mt-6 py-2 px-3 bg-green-500 hover:bg-green-600 rounded text-white"
          title="Click to speak"
        >
          🎙️ Voice Input
        </button>

        {/* Export and Copy */}
        <button
          onClick={exportTxt}
          className="mt-2 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 rounded text-white"
        >
          💾 Export Chat (TXT)
        </button>
        <button
          onClick={copyChat}
          className="mt-2 py-2 px-3 bg-indigo-500 hover:bg-indigo-600 rounded text-white"
        >
          📋 Copy Chat
        </button>
      </aside>

      {/* Main chat area */}
      <main className="flex flex-col flex-1 p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">AI Assistant Chatbot</h1>

          {/* Search */}
          <input
            type="text"
            placeholder="Search chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded w-64 dark:bg-gray-700 dark:text-gray-100"
          />
        </header>

        {/* Chat messages */}
        <div
          ref={chatContainerRef}
          className="flex flex-col flex-1 overflow-y-auto gap-3 p-4 border rounded bg-white dark:bg-gray-800"
        >
          {filteredMessages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[75%] p-3 rounded-md shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-gray-100 self-start"
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}

          {/* Typing animation */}
          {typing && (
            <div className="max-w-[75%] p-3 rounded-md shadow-sm bg-gray-200 dark:bg-gray-700 dark:text-gray-100 self-start italic">
              Assistant is typing...
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Type your message or command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
