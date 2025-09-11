import React, { useEffect, useRef, useState } from "react";
import api from "../config/Api.jsx";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FiArrowUp, FiChevronDown, FiX } from "react-icons/fi";

// A self-contained component for the settings panel, as per your plan.
const SettingsPanel = ({ settings, setSettings, closePanel }) => {
  const panelRef = useRef(null);

  // Effect to handle clicking outside the panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Also check that the click is not on the header button that opens the panel
      if (panelRef.current && !panelRef.current.contains(event.target) && !event.target.closest('.header-settings-button')) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closePanel]);

  return (
    <div
      ref={panelRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-4"
      // Basic animation for appearing
      style={{ animation: 'fadeInDown 0.3s ease-out' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Model Settings</h3>
        <button onClick={closePanel} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <FiX size={20}/>
        </button>
      </div>
      <div className="space-y-4">
        {/* Role (Persona) Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Persona
          </label>
          <select
            value={settings.role}
            onChange={(e) => setSettings({ ...settings, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none bg-white"
          >
            <option value="default">veda</option>
            <option value="funny">Funny</option>
            <option value="spiritual">Spiritual</option>
            <option value="Girl">Girl</option>
            <option value="kaliyug">Kaliyug Mindset</option>
          </select>
        </div>
        
        {/* Temperature Control */}
        <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>Creativity (Temperature)</span>
                <span className="font-bold text-gray-900">{settings.temperature}</span>
            </label>
            <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({...settings, temperature: e.target.value})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none bg-white"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>

          </select>
        </div>
      </div>
    </div>
  );
};

export default function ChatScreen({ chat, socket, modelSettings, setModelSettings }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (chat) {
      loadMessage();
    } else {
      setMessages([]);
    }
  }, [chat]);

  const loadMessage = async () => {
    if (!chat) return null;
    try {
      const allMessages = await api.get(`/chat/${chat.id}`);
      setMessages(allMessages.data.messages);
    } catch (error) {
      toast.error("Could not load conversation",{
         position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          closeOnClick: true,

      });
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleTypingStart = () => setIsTyping(true);
    const handleAiResponse = (messagePayload) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: messagePayload.content },
      ]);
    };
    const handleAiError = (errorPayload) => {
      setIsTyping(false);
      toast.error(errorPayload.message , { position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          closeOnClick: true,});
      setMessages((prev) => prev.slice(0, -1));
    };

    socket.on("typing-start", handleTypingStart);
    socket.on("ai-response", handleAiResponse);
    socket.on("ai-error", handleAiError);

    return () => {
      socket.off("typing-start", handleTypingStart);
      socket.off("ai-response", handleAiResponse);
      socket.off("ai-error", handleAiError);
    };
  }, [socket]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    
    // Include the dynamic model settings in the payload
    socket.emit("ai-message", {
      chat: chat.id,
      content: input,
      ...modelSettings, 
    });
    setInput("");
  };

    const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(e);
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  const markdownComponents = {
    pre: ({ node, ...props }) => <pre className="w-full" {...props} />,
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="w-full">
          <SyntaxHighlighter
            style={oneLight}
            language={match[1]}
            PreTag="div"
            customStyle={{
              backgroundColor: '#ffff',
              color: '#000000',
              borderRadius: '0.5rem',
              padding: '1rem',
              boxShadow:'0px 0px 10px #E5E7EB'
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-200 text-black rounded px-1.5 py-1 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
      <header className="h-12 border-b border-gray-200 flex items-center justify-center px-4 bg-white shadow-sm flex-shrink-0">
        <button onClick={() => setShowSettings(!showSettings)} className="header-settings-button flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-black transition p-2 rounded-md">
            Veda
            <FiChevronDown className={`transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} />
        </button>
      </header>
      
      {showSettings && <SettingsPanel settings={modelSettings} setSettings={setModelSettings} closePanel={() => setShowSettings(false)}/>}

      {chat ? (
        <>
        {messages.length != 0 ? 
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`font-inter prose prose-sm max-w-full md:max-w-[70%] px-4 py-3 rounded-lg shadow-sm break-words ${
                    msg.role === "user"
                      ? "bg-gray-200 text-black rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
      
            
            {isTyping && (
              <div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-lg px-4 py-3 shadow-sm rounded-bl-none">
                      <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation-delay:0.4s]"></div>
                      </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
:null}
          <form
            onSubmit={handleSend}
            className={`border border-gray-300 py-2 px-2 flex items-center gap-3 bg-white flex-shrink-0 rounded-full w-full max-w-[80%] mx-auto ${messages.length!=0 ? 'my-1' : 'my-auto'} `}
          >
           <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-2 outline-none font-medium text-sm w-full min-h-[40px] max-h-[120px] resize-y bg-transparent"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-black text-white p-3 rounded-full transition-colors disabled:bg-gray-200 disabled:text-gray-500"
            >
              <FiArrowUp />
            </button>
          </form>
          {messages.length != 0 ? 
          <div className="text-sm text-gray-500 text-center font-semibold py-2">Veda can make mistake.Please check carefully !</div>
          :null}
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          👋 Welcome! Start a new chat or select an existing one to begin your conversation with Veda-AI.
        </div>
      )}
    </div>
  );
}

// Simple keyframe animation for the panel
const styles = document.createElement('style');
styles.innerHTML = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translate(0, -50%);
    }
    to {
      opacity: 1;
      transform: translate(0, 0);
    }
  }
  .animate-fade-in-down {
    animation: fadeInDown 0.5s ease;
  }
`;
document.head.appendChild(styles);

