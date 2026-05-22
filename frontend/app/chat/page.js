"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getChats, createChat, getChatMessages } from "@/lib/axios";
import { getSocket, disconnectSocket } from "@/lib/socket";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import InputBar from "@/components/InputBar";
import s from "./Chat.module.css";

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const streamBufferRef = useRef("");
  const displayRef = useRef("");
  const animFrameRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await getChats();
        if (isMounted) {
          setChats(res.data.chats ?? []);
          setIsAuthenticated(true);
        }
      } catch {
        router.push("/signup_login");
      } finally {
        if (isMounted) setLoadingChats(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("connect_error", () => router.push("/signup_login"));

    socket.on("ai-response", (char) => {
      streamBufferRef.current += char;
      displayRef.current += char;
      setStreamingText(displayRef.current); // update UI immediately
    });

    socket.on("ai-response-end", () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const fullText = streamBufferRef.current;
      streamBufferRef.current = "";
      displayRef.current = "";
      setIsStreaming(false);
      setStreamingText("");
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          role: "model",
          content: fullText,
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    socket.on("ai-error", () => {
      setIsStreaming(false);
      setStreamingText("");
      streamBufferRef.current = "";
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      disconnectSocket();
    };
  }, [isAuthenticated, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSelectChat = useCallback(async (chatId) => {
    setActiveChatId(chatId);
    setMessages([]);
    setLoadingMessages(true);
    try {
      const res = await getChatMessages(chatId);
      setMessages(res.data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleNewChat = useCallback(async (title) => {
    try {
      const res = await createChat(title || "New Chat");
      const newChat = res.data.chat ?? res.data;
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat._id ?? newChat.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  }, []);

  const handleSend = useCallback(
    (text) => {
      if (!text.trim() || !activeChatId || isStreaming) return;
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          role: "user",
          content: text,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsStreaming(true);
      setStreamingText("");
      streamBufferRef.current = "";
      displayRef.current = "";
      socketRef.current?.emit("ai-message", {
        chat: activeChatId,
        content: text,
      });
    },
    [activeChatId, isStreaming],
  );

  const handleEmptySend = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming) return;
      let chatId = activeChatId;
      if (!chatId) {
        try {
          const res = await createChat("New Chat");
          const newChat = res.data.chat ?? res.data;
          setChats((prev) => [newChat, ...prev]);
          chatId = newChat._id ?? newChat.id;
          setActiveChatId(chatId);
          setMessages([]);
        } catch {
          return;
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          role: "user",
          content: text,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsStreaming(true);
      setStreamingText("");
      streamBufferRef.current = "";
      displayRef.current = "";
      socketRef.current?.emit("ai-message", { chat: chatId, content: text });
    },
    [activeChatId, isStreaming],
  );

  const activeChatTitle =
    chats.find((c) => (c._id ?? c.id) === activeChatId)?.title ?? "Chat";
  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className={s.root}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        loading={loadingChats}
      />

      <main className={`${s.main} ${!sidebarOpen ? s.mainFull : ""}`}>
        {/* Top bar */}
        <header className={s.topbar}>
          <button
            className={s.menuBtn}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <rect x="3" y="3" width="7" height="18" rx="1.5" />
              <path d="M14 8h6M14 12h6M14 16h6" />
            </svg>
          </button>
          {hasMessages && (
            <span className={s.topbarTitle}>{activeChatTitle}</span>
          )}
        </header>

        {/* Empty / welcome state */}
        {!hasMessages && !loadingMessages && (
          <div className={s.welcomeWrap}>
            <h1 className={s.welcomeHeading}>What's on your mind?</h1>
            <InputBar
              onSend={activeChatId ? handleSend : handleEmptySend}
              disabled={isStreaming}
              streaming={isStreaming}
              large
            />
          </div>
        )}

        {/* Chat view */}
        {(hasMessages || loadingMessages) && (
          <>
            <div className={s.messageArea}>
              {loadingMessages && (
                <div className={s.loadingDots}>
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg._id ?? msg.id} message={msg} />
              ))}
              {isStreaming && (
                <MessageBubble
                  message={{
                    role: "model",
                    content: streamingText,
                    _id: "streaming",
                  }}
                  streaming={!streamingText}
                />
              )}
              <div ref={bottomRef} />
            </div>
            <div className={s.inputDock}>
              <InputBar
                onSend={handleSend}
                disabled={!activeChatId || isStreaming}
                streaming={isStreaming}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
