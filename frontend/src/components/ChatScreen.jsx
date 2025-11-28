import React, { useEffect, useRef, useState } from "react";
import api from "../config/Api.jsx";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FiArrowUp, FiChevronDown, FiX } from "react-icons/fi";
import { Navigate } from "react-router-dom";

// A self-contained component for the settings panel, as per your plan.
const SettingsPanel = ({ settings, setSettings, closePanel }) => {
  const panelRef = useRef(null);

  // Effect to handle clicking outside the panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Also check that the click is not on the header button that opens the panel
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !event.target.closest(".header-settings-button")
      ) {
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
      className="absolute top-12 left-1/4 -translate-x-1/2 w-[90%] max-w-md bg-[#1a1a1a] border border-[#404040] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-[20px] z-20 p-4 animate-slide-down"
      style={{
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(59, 130, 246, 0.3)'
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#f3f4f6]">Model Settings</h3>
        <button
          onClick={closePanel}
          className="p-1 rounded-full text-[#9ca3af] hover:bg-[#252525] hover:text-[#f3f4f6] transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>
      <div className="space-y-4">
        {/* Role (Persona) Selection */}
        <div>
          <label className="block text-sm font-medium text-[#d1d5db] mb-1">
            Persona
          </label>
          <select
            value={settings.role}
            onChange={(e) => setSettings({ ...settings, role: e.target.value })}
            className="w-full px-3 py-2 border border-[#404040] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] focus:outline-none bg-[#0f0f0f] text-[#f3f4f6] hover:border-[#3b82f6] transition-colors"
          >
            <option value="default">Veda</option>
            <option value="funny">Funny</option>
            <option value="spiritual">Spiritual</option>
            <option value="Girl">Girl</option>
            <option value="Gen-Z">Gen-Z</option>
          </select>
        </div>

        {/* Temperature Control */}
        <div>
          <label className="flex justify-between text-sm font-medium text-[#d1d5db] mb-1">
            <span>Creativity (Temperature)</span>
            <span className="font-bold text-[#f3f4f6]">
              {settings.temperature}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) =>
              setSettings({ ...settings, temperature: e.target.value })
            }
            className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #6366f1 ${settings.temperature * 100}%, #2a2a2a ${settings.temperature * 100}%, #2a2a2a 100%)`
            }}
          />
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-[#d1d5db] mb-1">
            Model
          </label>
          <select
            value={settings.model}
            onChange={(e) =>
              setSettings({ ...settings, model: e.target.value })
            }
            className="w-full px-3 py-2 border border-[#404040] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] focus:outline-none bg-[#0f0f0f] text-[#f3f4f6] hover:border-[#3b82f6] transition-colors"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default function ChatScreen({
  chat,
  socket,
  modelSettings,
  setModelSettings,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLimitEx, setIsLimitEx] = useState(false);
  const [deferredPrompt , setDeferredPrompt] = useState(null);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
 const messagesEndRef = useRef(null);

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
      toast.error("Could not load conversation", {
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
    const tokenLimitExceed = () => {
 
      setIsTyping(false);
      toast.error("Token limit exceeded !", {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        closeOnClick: true,
      });
      setIsLimitEx(true);
    };
    const handleAiResponse = (messagePayload) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: messagePayload.content },
      ]);
    };
    const handleAiError = (errorPayload) => {
      setIsTyping(false);
      toast.error(errorPayload.message, {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        closeOnClick: true,
      });
      setMessages((prev) => prev.slice(0, -1));
    };

    socket.on("typing-start", handleTypingStart);
    socket.on("token-limit-exceeded", tokenLimitExceed);
    socket.on("ai-response", handleAiResponse);
    socket.on("ai-error", handleAiError);

    return () => {
      socket.off("typing-start", handleTypingStart);
      socket.off("token-limit-exceeded", tokenLimitExceed);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  useEffect(()=>{
       const handleApp = (e) =>{
      e.preventDefault();
    setDeferredPrompt(e);
    setShowDownloadApp(true);
    }
    window.addEventListener("beforeinstallprompt",handleApp)

    return ()=>window.removeEventListener("beforeinstallprompt",handleApp)
  },[])

  const handleAppDownload =async ()=>{
    if(!deferredPrompt) return ;
    deferredPrompt.prompt()
    const {outcome} = await deferredPrompt.userChoice
    console.log(outcome)
    setDeferredPrompt(null) 
    showDownloadApp(false)
  }
  // if(!showDownloadApp) return null
  const markdownComponents = {
    pre: ({ node, ...props }) => <pre className="w-full" {...props} />,
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <div className="w-full">
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              backgroundColor: "#1e1e1e",
              color: "#e5e7eb",
              borderRadius: "0.5rem",
              padding: "1rem",
              border: "1px solid #2a2a2a",
            }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="bg-[#1e1e1e] text-[#e5e7eb] rounded px-1.5 py-1 font-mono text-sm border border-[#404040]"
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#0a0a0a]">
      <header className="h-12 border-b border-[#404040] flex items-center justify-between px-4 bg-[#0d0d0d] shadow-sm flex-shrink-0">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="header-settings-button flex items-center gap-2 text-lg font-semibold text-[#f3f4f6] hover:text-[#3b82f6] transition-all duration-200 p-2 rounded-md hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          Veda
          <FiChevronDown
            className={`transition-transform duration-300 ${
              showSettings ? "rotate-180" : ""
            }`}
          />
        </button>
        <button 
          className="cursor-pointer border border-[#3b82f6] header-settings-button flex items-center gap-2 text-sm font-semibold text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white transition-all duration-200 px-3 py-1.5 rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
          onClick={()=>handleAppDownload}
        >
          Get app
        </button>
      </header>

      {showSettings && (
        <SettingsPanel
          settings={modelSettings}
          setSettings={setModelSettings}
          closePanel={() => setShowSettings(false)}
        />
      )}

      {chat ? (
        <>
          {messages.length != 0 ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0a0a0a]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`font-inter prose prose-sm max-w-full md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm break-words animate-slide-up ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-[#1e3a8a] to-[#3730a3] text-[#f3f4f6] rounded-br-md shadow-[0_4px_12px_rgba(30,58,138,0.4)]"
                        : "bg-[#1a1a1a] text-[#e5e7eb] rounded-bl-md border border-[#404040] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
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
                  <div className="bg-[#1a1a1a] text-[#e5e7eb] rounded-2xl px-4 py-3 shadow-sm rounded-bl-md border border-[#404040] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#6b7280] animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#6b7280] animate-pulse [animation-delay:0.2s] shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#6b7280] animate-pulse [animation-delay:0.4s] shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : null}
          {isLimitEx ? (
            <div className="max-w-[80%] mx-auto my-auto p-6 rounded-2xl bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white shadow-[0_10px_40px_rgba(239,68,68,0.4)] flex flex-col items-center gap-4 animate-scale-in border-2 border-[#ef4444] animate-pulse-glow">
              <h2 className="text-lg font-bold">⚠️ Token Limit Exceeded</h2>
              <p className="text-sm text-center">
                You’ve reached your token usage limit. Please upgrade your plan
                to continue asking unlimited questions.
              </p>
              <button
                onClick={() => {
                  toast.info("You will be notify soon !", {
                    position: "bottom-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    closeOnClick: true,
                  });
                }}
                className="px-5 py-2 rounded-full bg-white text-[#ef4444] font-semibold hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                Upgrade Now
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSend}
              className={`border border-[#404040] py-2 px-2 flex items-center gap-3 bg-[#1a1a1a] flex-shrink-0 rounded-3xl w-full max-w-[80%] mx-auto focus-within:border-[#3b82f6] focus-within:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 ${
                messages.length != 0 ? "my-1" : "my-auto"
              }`}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask anything..."
                className="flex-1 px-4 py-2 outline-none font-medium text-sm w-full min-h-[40px] max-h-[120px] resize-y bg-transparent text-[#f3f4f6] placeholder:text-[#6b7280]"
                rows={1}
                disabled={isTyping ? true : false}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white p-3 rounded-full transition-all duration-200 disabled:bg-[#2a2a2a] disabled:text-[#6b7280] hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              >
                <FiArrowUp />
              </button>
            </form>
          )}

          {messages.length != 0 ? (
            <div className="text-sm text-[#6b7280] text-center font-semibold py-2">
              Veda can make mistake. Please check carefully!
            </div>
          ) : null}
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-[#9ca3af] text-sm bg-gradient-radial from-[#0f0f0f] to-[#0a0a0a] p-8">
          <img src="/logo.svg" alt="Veda Logo" className="w-32 h-32 mb-6 animate-float" style={{filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))'}} />
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent animate-gradient">
            Welcome to Veda AI
          </h1>
          <p className="text-[#d1d5db] text-center max-w-md mb-8">
            👋 Start a new chat or select an existing one to begin your intelligent conversation with Veda-AI.
          </p>
        </div>
      )}
    </div>
  );
}


