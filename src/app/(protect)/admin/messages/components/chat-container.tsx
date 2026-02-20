"use client";

import React, { useState, useEffect, useRef } from "react";
import { database, auth as firebaseAuth } from "@/src/lib/firebase";
import {
  ref,
  onValue,
  push,
  serverTimestamp,
  off,
  set,
} from "firebase/database";
import { signInWithCustomToken } from "firebase/auth";
import axios from "axios";
import { format } from "date-fns";
import {
  IconSend,
  IconMessage,
  IconUser,
  IconLoader2,
  IconSearch,
} from "@tabler/icons-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

interface Participant {
  id: string;
  type: "User" | "Admin";
  name: string;
  avatarUrl: string | null;
}

interface Conversation {
  id: string;
  updatedAt: string;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  otherParticipant: Participant | null;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderType: "User" | "Admin";
  timestamp: number;
}

export function ChatContainer() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Firebase Auth with Custom Token
  useEffect(() => {
    const authenticateFirebase = async () => {
      try {
        const res = await axios.post("/api/auth/firebase-custom-token");
        await signInWithCustomToken(firebaseAuth, res.data.token);
        setAuthLoading(false);
      } catch (err) {
        console.error("Firebase auth failed:", err);
      }
    };
    authenticateFirebase();
  }, []);

  // 2. Fetch Conversations
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await axios.get("/api/conversations");
        setConversations(res.data.conversations);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setLoading(false);
      }
    };
    fetchConvs();
  }, []);

  // 3. Listen to messages when conversation selected
  useEffect(() => {
    if (!selectedConv || authLoading) return;

    const messagesRef = ref(database, `messages/${selectedConv.id}`);

    const unsubscribe = onValue(messagesRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const msgList: Message[] = Object.entries(data)
          .map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgList);
      } else {
        setMessages([]);
      }
    });

    return () => off(messagesRef);
  }, [selectedConv, authLoading]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();

    try {
      // 1. Send to Firebase
      const messagesRef = ref(database, `messages/${selectedConv.id}`);
      await push(messagesRef, {
        text: messageContent,
        senderId: firebaseAuth.currentUser?.uid,
        senderType: "Admin",
        timestamp: serverTimestamp(),
      });

      // 2. Sync to Postgres for List Preview
      await axios.patch(`/api/conversations/${selectedConv.id}`, {
        lastMessageContent: messageContent,
      });

      setNewMessage("");

      // Local update for immediate feedback in the list
      setConversations(prev =>
        prev
          .map(c =>
            c.id === selectedConv.id
              ? {
                  ...c,
                  lastMessageContent: messageContent,
                  lastMessageAt: new Date().toISOString(),
                }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || 0).getTime() -
              new Date(a.lastMessageAt || 0).getTime(),
          ),
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-160px)] min-h-[500px] grid-cols-12 gap-0 overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Sidebar: Chat List */}
      <div className="col-span-4 flex flex-col border-r bg-muted/20">
        <div className="p-4 border-b">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-9 bg-background"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <IconMessage size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "flex items-start gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                    selectedConv?.id === conv.id && "bg-accent",
                  )}
                >
                  <Avatar className="size-10 border">
                    <AvatarImage src={conv.otherParticipant?.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {conv.otherParticipant?.name
                        ?.substring(0, 2)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold">
                        {conv.otherParticipant?.name || "Unknown"}
                      </span>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(conv.lastMessageAt), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessageContent || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content: Chat Window */}
      <div className="col-span-8 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-background p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border">
                  <AvatarImage
                    src={selectedConv.otherParticipant?.avatarUrl || ""}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConv.otherParticipant?.name
                      ?.substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold leading-none">
                    {selectedConv.otherParticipant?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedConv.otherParticipant?.type} Participant
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-muted/5 p-4 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                  <div className="rounded-full bg-primary/5 p-4 mb-3">
                    <IconMessage size={32} />
                  </div>
                  <p className="text-sm font-medium">Say hello!</p>
                  <p className="text-xs">
                    Start the conversation with{" "}
                    {selectedConv.otherParticipant?.name}
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderType === "Admin";
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col space-y-1",
                        isMe ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-background border rounded-tl-none",
                        )}
                      >
                        {msg.text}
                      </div>
                      <span className="px-1 text-[10px] text-muted-foreground">
                        {msg.timestamp
                          ? format(new Date(msg.timestamp), "HH:mm")
                          : ""}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="border-t bg-background p-4"
            >
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={authLoading}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || authLoading || sending}
                  size="icon"
                >
                  {sending ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconSend className="size-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/5 p-6 mb-4">
              <IconMessage size={48} className="text-primary/20" />
            </div>
            <h2 className="text-xl font-semibold">Admin Messaging</h2>
            <p className="max-w-xs text-sm text-muted-foreground mt-2">
              Select a conversation from the left to start chatting with
              recruiters and users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
