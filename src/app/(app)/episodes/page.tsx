"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

interface Episode {
  id: string;
  title: string;
  ideaCount: number;
  createdAt: string;
}

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadEpisodes = useCallback(async () => {
    const res = await fetch("/api/episodes");
    if (res.ok) setEpisodes(await res.json());
  }, []);

  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);

  async function createEpisode(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch("/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });

    if (res.ok) {
      setNewTitle("");
      setShowForm(false);
      loadEpisodes();
    }
  }

  return (
    <div>
      <PageHeader
        title="Episodes"
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
        <form onSubmit={createEpisode} className="px-4 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Episode title..."
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
        {episodes.length === 0 && (
          <p className="text-silver-mist/50 text-center py-8">
            No episodes yet. Tap &quot;+ New&quot; to create one.
          </p>
        )}
        {episodes.map((episode) => (
          <Link
            key={episode.id}
            href={`/episodes/${episode.id}`}
            className="block border border-slate-gray p-3 transition-colors hover:border-silver-mist/30"
          >
            <h3 className="text-white font-medium">{episode.title}</h3>
            <span className="text-xs text-silver-mist/60">
              {episode.ideaCount} {episode.ideaCount === 1 ? "idea" : "ideas"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
