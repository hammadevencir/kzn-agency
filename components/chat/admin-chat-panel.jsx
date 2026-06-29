"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { useChatConversations } from "@/lib/hooks/useChatConversations";
import { useChatMessages } from "@/lib/hooks/useChatMessages";
import { CHAT_SENDER_ROLE } from "@/lib/chat/constants";
import {
  formatChatTimestamp,
  getChatPreviewText,
} from "@/lib/chat/client";
import ChatMessageList from "@/components/chat/chat-message-list";
import ChatComposer from "@/components/chat/chat-composer";

function userLabel(user) {
  const name = (user?.displayName || user?.name || "").trim();
  if (name) return name;
  const email = (user?.email || "").trim();
  if (email) return email.split("@")[0];
  return "User";
}

function userInitial(user) {
  const label = userLabel(user);
  return label.charAt(0).toUpperCase();
}

/**
 * @param {Record<string, unknown>} conv
 */
function conversationLabel(conv) {
  const name = typeof conv.userDisplayName === "string" ? conv.userDisplayName.trim() : "";
  if (name) return name;
  const email = typeof conv.userEmail === "string" ? conv.userEmail.trim() : "";
  if (email) return email.split("@")[0];
  return "User";
}

export default function AdminChatPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFromUrl = searchParams.get("with");

  const { conversations, loading: convLoading } = useChatConversations();
  const [selectedUserId, setSelectedUserId] = useState(
    /** @type {string | null} */ (selectedFromUrl)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [usersLoading, setUsersLoading] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");

  const { messages, loading: msgLoading, error } = useChatMessages(selectedUserId, {
    markRead: true,
  });

  useEffect(() => {
    if (selectedFromUrl) {
      setSelectedUserId(selectedFromUrl);
    }
  }, [selectedFromUrl]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(Array.isArray(data.users) ? data.users : []);
      }
    } catch {
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showNewChat && allUsers.length === 0) {
      loadUsers();
    }
  }, [showNewChat, allUsers.length, loadUsers]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const label = conversationLabel(c).toLowerCase();
      const email = (typeof c.userEmail === "string" ? c.userEmail : "").toLowerCase();
      return label.includes(q) || email.includes(q) || c.id.includes(q);
    });
  }, [conversations, searchQuery]);

  const filteredNewChatUsers = useMemo(() => {
    const q = newChatSearch.trim().toLowerCase();
    return allUsers
      .filter((u) => typeof u.id === "string")
      .filter((u) => {
        if (!q) return true;
        const label = userLabel(u).toLowerCase();
        const email = (typeof u.email === "string" ? u.email : "").toLowerCase();
        return label.includes(q) || email.includes(q) || String(u.id).includes(q);
      })
      .slice(0, 20);
  }, [allUsers, newChatSearch, conversations]);

  const selectUser = (userId) => {
    setSelectedUserId(userId);
    setShowNewChat(false);
    router.replace(`/admin/chat?with=${encodeURIComponent(userId)}`, {
      scroll: false,
    });
  };

  const selectedConversation = conversations.find((c) => c.id === selectedUserId);
  const selectedUserFromList = allUsers.find((u) => u.id === selectedUserId);

  const headerTitle = selectedConversation
    ? conversationLabel(selectedConversation)
    : selectedUserFromList
      ? userLabel(selectedUserFromList)
      : selectedUserId
        ? "User"
        : "Select a conversation";

  const headerSubtitle =
    (selectedConversation &&
      typeof selectedConversation.userEmail === "string" &&
      selectedConversation.userEmail) ||
    (selectedUserFromList &&
      typeof selectedUserFromList.email === "string" &&
      selectedUserFromList.email) ||
    "";

  return (
    <div className="flex h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] border-t border-border">
      {/* Conversation list */}
      <div className="w-full max-w-[320px] shrink-0 flex flex-col border-r border-border bg-tertiary">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-white">Messages</h1>
            <button
              type="button"
              onClick={() => {
                setShowNewChat((v) => !v);
                if (!showNewChat) loadUsers();
              }}
              className="p-2 rounded-lg text-quaternary hover:text-white hover:bg-muted"
              aria-label="New message"
            >
              <UserPlus className="size-5" />
            </button>
          </div>

          {showNewChat ? (
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-quaternary" />
                <input
                  type="text"
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="Search users…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#2A3540] border border-border text-sm text-white placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-[#2A3540] border border-border">
                {usersLoading ? (
                  <p className="p-3 text-sm text-quaternary">Loading users…</p>
                ) : filteredNewChatUsers.length === 0 ? (
                  <p className="p-3 text-sm text-quaternary">No users found.</p>
                ) : (
                  filteredNewChatUsers.map((u) => (
                    <button
                      key={String(u.id)}
                      type="button"
                      onClick={() => selectUser(String(u.id))}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left"
                    >
                      <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                        {userInitial(u)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{userLabel(u)}</p>
                        {typeof u.email === "string" ? (
                          <p className="text-xs text-quaternary truncate">{u.email}</p>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-quaternary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#2A3540] border border-border text-sm text-white placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <p className="p-4 text-sm text-quaternary">Loading…</p>
          ) : filteredConversations.length === 0 ? (
            <p className="p-4 text-sm text-quaternary">
              No conversations yet. Start a new message with a user.
            </p>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === selectedUserId;
              const unread = Number(conv.adminUnreadCount) || 0;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectUser(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/50 transition-colors ${
                    isActive ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                    {conversationLabel(conv).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {conversationLabel(conv)}
                      </p>
                      <span className="text-[10px] text-quaternary shrink-0">
                        {formatChatTimestamp(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-quaternary truncate">
                        {getChatPreviewText(
                          typeof conv.lastMessageText === "string"
                            ? conv.lastMessageText
                            : "",
                          Boolean(conv.lastMessageHasAttachment)
                        )}
                      </p>
                      {unread > 0 ? (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-medium flex items-center justify-center">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active thread */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedUserId ? (
          <>
            <div className="shrink-0 px-6 py-4 border-b border-border bg-tertiary">
              <h2 className="text-lg font-semibold text-white">{headerTitle}</h2>
              {headerSubtitle ? (
                <p className="text-sm text-quaternary">{headerSubtitle}</p>
              ) : null}
            </div>

            {error ? (
              <div className="px-4 py-2 text-sm text-[#FA3C67] bg-[#FA3C67]/10">
                Could not load messages. Deploy Firestore rules if you haven&apos;t yet.
              </div>
            ) : null}

            <ChatMessageList
              messages={messages}
              loading={msgLoading}
              viewerRole={CHAT_SENDER_ROLE.ADMIN}
            />

            <ChatComposer conversationUserId={selectedUserId} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-quaternary text-sm px-4 text-center">
            Select a conversation or start a new message with a user.
          </div>
        )}
      </div>
    </div>
  );
}
