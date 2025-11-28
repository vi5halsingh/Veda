import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiMessageSquare,
  FiMenu,
  FiChevronLeft,
  FiSettings,
  FiLogOut,
  FiMoreHorizontal,
} from "react-icons/fi";
import {
  HiMiniArrowRightEndOnRectangle,
  HiMiniArrowLeftEndOnRectangle,
} from "react-icons/hi2";
import api from "../config/Api";
import { toast } from "react-toastify";
import logo from "/logo.svg";

export default function Sidebar({ onSelectChat, selectedChatId, socket }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [showSettingsCard, setShowSettingsCard] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const Navigate = useNavigate();

  // refs for click-outside
  const menuRef = useRef(null);
  const settingsBtnRef = useRef(null);
  const settingsCardRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  // Listen for token updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleTokenUpdate = (data) => {
      setTokenCount(data.tokenLimit);
      
      // Also update localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.token = data.tokenLimit;
        localStorage.setItem("user", JSON.stringify(userObj));
      }
    };

    socket.on("token-update", handleTokenUpdate);

    return () => {
      socket.off("token-update", handleTokenUpdate);
    };
  }, [socket]);

  const user = JSON.parse(localStorage.getItem("user"));
  
  // Initialize token count from user data
  useEffect(() => {
    if (user?.token) {
      setTokenCount(user.token);
    }
  }, [user?.token]);
  const fetchChats = async () => {
    try {
      const response = await api.get("/chat", {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true
      });
      setChats(response.data.chats);
      setError(null);
    } catch (error) {
      console.log(error)
      toast.error("Could not load chats", {
        position: "bottom-right",
        autoClose: 2000,
        closeOnClick: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const createChat = async () => {
    setIsCreating(true);
    try {
      const response = await api.post("/chat", { title: "New Chat" });
      if (response.status === 200) {
        const newChat = response.data.chat;
        setChats((prevChats) => [newChat, ...prevChats]);
        if (onSelectChat) onSelectChat(newChat);
        toast.success("new chat created", {
          position: "bottom-right",
          autoClose: 1000,
          closeOnClick: true,
        });
      }
    } catch (error) {
      toast.error("Could not create new chat", {
        position: "bottom-right",
        autoClose: 2000,
        closeOnClick: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renameChat = async (chatId) => {
    if (!newChatTitle.trim()) {
      toast.error("Chat title cannot be empty", {
        position: "bottom-right",
        autoClose: 1000,
        closeOnClick: true,
      });
      return;
    }
    try {
      const response = await api.patch(`/chat/${chatId}`, {
        title: newChatTitle,
      });
      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? response.data.chat : chat))
      );
      setEditingChatId(null);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to rename chat", {
        position: "bottom-right",
        autoClose: 1000,
        closeOnClick: true,
      });
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await api.delete(`/chat/${chatId}`);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) onSelectChat(null);
    } catch (error) {
      toast.error("Failed to delete chat", {
        position: "bottom-right",
        autoClose: 1000,
        closeOnClick: true,
      });
    }
  };

  const formatLastActivity = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("user");
      Navigate("/auth-user");
    } catch (error) {
      toast.error("Logout failed", {
        position: "bottom-right",
        autoClose: 1000,
        closeOnClick: true,
      });
    }
  };

  // close menus on outside click / Esc
  useEffect(() => {
    const onDown = (e) => {
      // close chat row menu
      if (
        menuOpenId &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpenId(null);
      }
      // close settings popover
      if (showSettingsCard) {
        const clickOnBtn = settingsBtnRef.current?.contains(e.target);
        const clickOnCard = settingsCardRef.current?.contains(e.target);
        if (!clickOnBtn && !clickOnCard) setShowSettingsCard(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpenId(null);
        setEditingChatId(null);
        setShowSettingsCard(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpenId, showSettingsCard]);

  if (loading) {
    return (
      <div className="h-screen w-64 bg-[#0f0f0f] border-r border-[#404040] p-4 flex flex-col">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-[#1a1a1a] rounded animate-shimmer"></div>
          <div className="h-8 bg-[#1a1a1a] rounded w-3/4 animate-shimmer"></div>
          <div className="h-8 bg-[#1a1a1a] rounded w-1/2 animate-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-r border-[#404040] relative h-screen bg-[#0f0f0f] text-[#f3f4f6] flex flex-col transition-all duration-200 ${isMinimized ? "w-16" : "w-72"
        }`}
    >
      {/* Header */}
      <div className="p-2 flex items-center justify-between border-b border-[#404040] bg-[#0a0a0a]">
        {!isMinimized && <img src={logo} alt="logo" className="w-7 h-7 animate-float" />}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 rounded hover:bg-[#1e1e1e] transition-all duration-200 cursor-ew-resize hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          {isMinimized ? (
            <HiMiniArrowRightEndOnRectangle className="text-[#9ca3af]" />
          ) : (
            <HiMiniArrowLeftEndOnRectangle className="text-[#9ca3af]" />
          )}
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={createChat}
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:scale-[1.02] active:scale-[0.98] text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_30px_rgba(59,130,246,0.5)]"
        >
          <FiPlus className={isCreating ? "animate-spin" : ""} />
          {!isMinimized && "New Chat"}
        </button>
      </div>

      {/* Error */}
      {error && !isMinimized && (
        <div className="mx-3 p-2 bg-[rgba(239,68,68,0.1)] border border-[#ef4444] rounded-lg text-[#fca5a5] text-sm">
          {error}
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-16">
        {chats?.map((chat, i) => {
          const isActive = selectedChatId === chat.id;
          return (
            <div
              key={i}
              onClick={() => onSelectChat?.(chat)}
              className={`group relative w-full px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-all duration-150 ${isActive
                ? "bg-[#1a1a1a] border-l-[3px] border-[#3b82f6]"
                : "hover:bg-[#1e1e1e] border-l-[3px] border-transparent"
                }`}
            >
              <FiMessageSquare className="flex-shrink-0 text-[#9ca3af]" />
              {!isMinimized && (
                <div className="flex-1 min-w-0 flex items-center">
                  {/* title / rename */}
                  <div className="flex-1 min-w-0">
                    {editingChatId === chat.id ? (
                      <input
                        autoFocus
                        value={newChatTitle}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && renameChat(chat.id)
                        }
                        className="w-full px-2 py-1 rounded bg-[#0f0f0f] text-[#f3f4f6] border border-[#404040] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                      />
                    ) : (
                      <>
                        <p className="truncate text-[#f3f4f6]">{chat.title}</p>
                        {chat.lastactivity && (
                          <p className="text-xs text-[#6b7280] truncate">
                            {formatLastActivity(chat.lastactivity)}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* hover-only actions (three dots) */}
                  <div
                    className={`ml-2 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${menuOpenId === chat.id || editingChatId === chat.id
                      ? "opacity-100"
                      : ""
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                      }}
                      className="p-1.5 rounded hover:bg-[#252525] focus-visible:outline-none text-[#9ca3af] hover:text-[#f3f4f6]"
                      aria-label="More"
                      title="More"
                    >
                      <FiMoreHorizontal />
                    </button>
                  </div>

                  {/* context menu */}
                  {menuOpenId === chat.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-10 z-20 rounded-md bg-[#1a1a1a] border border-[#404040] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-[10px] animate-slide-down"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingChatId(chat.id);
                          setNewChatTitle(chat.title);
                          setMenuOpenId(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[#252525] cursor-pointer text-[#f3f4f6] transition-colors duration-150"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          deleteChat(chat.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[#252525] cursor-pointer text-[#f3f4f6] transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom: Settings/Profile */}
      <div className="p-3 border-t border-[#404040]">
        <button
          ref={settingsBtnRef}
          onClick={() => setShowSettingsCard((s) => !s)}
          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#1e1e1e] transition-all duration-200 cursor-pointer text-[#f3f4f6]"
        >
          <FiSettings className="text-[#9ca3af]" />
          {!isMinimized && <span>{user?.fullname?.firstname || "User"}</span>}
        </button>
      </div>

      {showSettingsCard && !isMinimized && (
        <div
          ref={settingsCardRef}
          className="absolute bottom-16 left-3 z-30 w-64 rounded-xl border border-[#404040] bg-[#1a1a1a] shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-[20px] animate-scale-in"
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(59, 130, 246, 0.3)'
          }}
        >
          <div className="p-2">
            <div className="px-3 py-2 text-sm text-[#f3f4f6] border-b border-[#404040]">
              {user?.fullname?.firstname || "User"}
            </div>
            <div className="px-3 py-2 text-sm text-[#d1d5db] border-b border-[#404040]">
              Token : {tokenCount || user?.token || "10"}
            </div>
            {/* keep only logout action as per existing functionality */}
            <button
              onClick={handleLogout}
              className="mt-1 w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-[#252525] text-left text-[#ef4444] cursor-pointer transition-colors duration-150"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
