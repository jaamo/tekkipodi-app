"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import PageHeader from "@/components/layout/PageHeader";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
}

interface Topic {
  topic: string;
  description: string;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [addedTopics, setAddedTopics] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/ideas/${id}/chat`);
    if (res.ok) setMessages(await res.json());
  }, [id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamText, scrollToBottom]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setStreaming(true);
    setStreamText("");

    // Optimistic add user message
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, role: "user", content: userMessage },
    ]);

    try {
      const res = await fetch(`/api/ideas/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok || !res.body) {
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamText(fullText);
      }

      // Replace with server data
      setStreamText("");
      await loadMessages();
    } catch (error) {
      console.error("Chat error:", error);
    }

    setStreaming(false);
  }

  async function generateTopics() {
    setGeneratingTopics(true);
    try {
      const res = await fetch(`/api/ideas/${id}/chat/topics`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
        setAddedTopics(new Set());
      }
    } catch (error) {
      console.error("Topic generation error:", error);
    }
    setGeneratingTopics(false);
  }

  async function addTopicToNotes(topic: Topic, index: number) {
    const text = `\n\n## ${topic.topic}\n${topic.description}`;
    const res = await fetch(`/api/ideas/${id}`);
    if (res.ok) {
      const idea = await res.json();
      await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: idea.notes + text }),
      });
      setAddedTopics((prev) => new Set([...prev, index]));
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Help me think"
        back
        action={
          <button
            onClick={generateTopics}
            disabled={generatingTopics || messages.length === 0}
            className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors disabled:opacity-50"
          >
            {generatingTopics ? "Generating..." : "Topics"}
          </button>
        }
      />

      {/* Topics panel */}
      {topics.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-gray">
          <p className="text-xs text-silver-mist/60 uppercase tracking-wide mb-2">
            Tap to add to notes
          </p>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <button
                key={i}
                onClick={() => addTopicToNotes(topic, i)}
                disabled={addedTopics.has(i)}
                className={`px-3 py-1 border text-sm text-left transition-colors ${
                  addedTopics.has(i)
                    ? "border-marker-blue/30 text-marker-blue/50"
                    : "border-slate-gray text-silver-mist hover:border-marker-blue"
                }`}
                title={topic.description}
              >
                {addedTopics.has(i) ? "✓ " : ""}
                {topic.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !streaming && (
          <p className="text-silver-mist/50 text-center py-8 text-sm">
            Ask questions about this idea to explore it deeper.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] px-3 py-2 text-sm whitespace-pre-line ${
              msg.role === "user"
                ? "ml-auto bg-slate-gray text-white"
                : "mr-auto border border-slate-gray text-silver-mist"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {streaming && streamText && (
          <div className="max-w-[85%] mr-auto border border-slate-gray text-silver-mist px-3 py-2 text-sm whitespace-pre-line">
            {streamText}
            <span className="animate-pulse">▊</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="px-4 py-3 border-t border-slate-gray flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={streaming}
          className="flex-1 px-3 py-2 bg-transparent border border-slate-gray text-silver-mist placeholder:text-silver-mist/50 outline-none focus:border-marker-blue disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="px-4 py-2 border border-slate-gray text-silver-mist hover:border-marker-blue transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
