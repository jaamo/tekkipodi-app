"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      const idea = await res.json();
      router.push(`/ideas/${idea.id}`);
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
          <div className="flex items-center gap-3">
            <Link
              href="/ideas/archived"
              className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors"
            >
              Archive
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors"
            >
              {showForm ? "Cancel" : "+ New"}
            </button>
          </div>
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
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center shrink-0">
                <button
                  onClick={(e) => vote(idea.id, "up", e)}
                  className="px-2 py-1 border border-slate-gray text-silver-mist/60 hover:text-marker-blue hover:border-marker-blue transition-colors text-sm leading-none"
                  aria-label="Upvote"
                >
                  ▲
                </button>
                <span className="text-sm font-medium text-white min-w-[28px] text-center py-1">
                  {idea.voteScore}
                </span>
                <button
                  onClick={(e) => vote(idea.id, "down", e)}
                  className="px-2 py-1 border border-slate-gray text-silver-mist/60 hover:text-accent-red hover:border-accent-red transition-colors text-sm leading-none"
                  aria-label="Downvote"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{idea.title}</h3>
              </div>
              <span className="flex items-center gap-1 text-xs text-silver-mist/60 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {idea.viewCount}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
