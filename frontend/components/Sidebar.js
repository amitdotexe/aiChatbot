"use client";

import { useState, useRef, useEffect } from "react";
import s from "./Sidebar.module.css";

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  open,
  onToggle,
  loading,
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const handleConfirm = async () => {
    if (creating) {
      setCreating(false);
      await onNewChat(title.trim() || "New Chat");
      setTitle("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") {
      setCreating(false);
      setTitle("");
    }
  };

  return (
    <>
      {open && <div className={s.overlay} onClick={onToggle} />}
      <aside className={`${s.sidebar} ${open ? s.open : s.closed}`}>
        {/* New chat button or inline input */}
        <div className={s.top}>
          {!creating ? (
            <button className={s.newChatBtn} onClick={() => setCreating(true)}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New chat
            </button>
          ) : (
            <div className={s.newChatForm}>
              <input
                ref={inputRef}
                className={s.newChatInput}
                type="text"
                placeholder="Chat title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className={s.confirmBtn}
                onClick={handleConfirm}
                aria-label="Create"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 10l5 5 7-7" />
                </svg>
              </button>
              <button
                className={s.cancelBtn}
                onClick={() => {
                  setCreating(false);
                  setTitle("");
                }}
                aria-label="Cancel"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <p className={s.sectionLabel}>Recent</p>

        <nav className={s.chatList}>
          {loading && (
            <div className={s.skeletons}>
              {[80, 65, 72, 55].map((w, i) => (
                <div
                  key={i}
                  className={s.skeleton}
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          )}
          {!loading && chats.length === 0 && (
            <p className={s.emptyText}>No chats yet.</p>
          )}
          {!loading &&
            chats.map((chat) => {
              const id = chat._id ?? chat.id;
              return (
                <button
                  key={id}
                  className={`${s.chatItem} ${activeChatId === id ? s.active : ""}`}
                  onClick={() => onSelectChat(id)}
                >
                  <svg
                    className={s.chatIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <span className={s.chatTitle}>{chat.title}</span>
                </button>
              );
            })}
        </nav>

        <div className={s.bottom}>
          <div className={s.brand}>
            <svg viewBox="0 0 32 32" fill="none" className={s.brandIcon}>
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeDasharray="4 2"
              />
              <circle cx="16" cy="16" r="5" fill="currentColor" opacity="0.7" />
            </svg>
            <span>TARS</span>
          </div>
        </div>
      </aside>
    </>
  );
}
