"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

interface Idea {
  id: string;
  title: string;
  voteScore: number;
  viewCount: number;
  isFaded: boolean;
  createdAt: string;
  links: { id: string }[];
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadIdeas = useCallback(async () => {
    const res = await fetch("/api/ideas");
    if (res.ok) setIdeas(await res.json());
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  async function createIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });

    if (res.ok) {
      setNewTitle("");
      setShowForm(false);
      loadIdeas();
    }
  }

  async function vote(id: string, direction: "up" | "down", e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/ideas/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    loadIdeas();
  }

  return (
    <div>
      <PageHeader
        title="Ideas"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors"
          >
            {showForm ? "Cancel" : "+ New"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={createIdea} className="px-4 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Idea title..."
              className="flex-1 px-3 py-2 bg-transparent border border-slate-gray text-silver-mist placeholder:text-silver-mist/50 outline-none focus:border-marker-blue"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 border border-slate-gray text-silver-mist hover:border-marker-blue transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="px-4 space-y-2">
        {ideas.length === 0 && (
          <p className="text-silver-mist/50 text-center py-8">
            No ideas yet. Tap &quot;+ New&quot; to add one.
          </p>
        )}
        {ideas.map((idea) => (
          <Link
            key={idea.id}
            href={`/ideas/${idea.id}`}
            className={`block border border-slate-gray p-3 transition-colors hover:border-silver-mist/30 ${
              idea.isFaded ? "opacity-40" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={(e) => vote(idea.id, "up", e)}
                  className="text-silver-mist/60 hover:text-marker-blue text-xs leading-none"
                  aria-label="Upvote"
                >
                  ▲
                </button>
                <span className="text-sm font-medium text-white min-w-[20px] text-center">
                  {idea.voteScore}
                </span>
                <button
                  onClick={(e) => vote(idea.id, "down", e)}
                  className="text-silver-mist/60 hover:text-accent-red text-xs leading-none"
                  aria-label="Downvote"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{idea.title}</h3>
                <div className="flex gap-3 text-xs text-silver-mist/60 mt-1">
                  <span>{idea.viewCount} views</span>
                  <span>{idea.links.length} links</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
