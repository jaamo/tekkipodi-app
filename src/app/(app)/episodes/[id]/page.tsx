"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

interface IdeaInEpisode {
  id: string;
  title: string;
  notes: string;
  voteScore: number;
  links: { id: string; url: string; title: string | null; summary: string | null }[];
}

interface EpisodeData {
  id: string;
  title: string;
  ideas: IdeaInEpisode[];
}

export default function EpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [episode, setEpisode] = useState<EpisodeData | null>(null);
  const [title, setTitle] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadEpisode = useCallback(async () => {
    const res = await fetch(`/api/episodes/${id}`);
    if (res.ok) {
      const data = await res.json();
      setEpisode(data);
      setTitle(data.title);
    }
  }, [id]);

  useEffect(() => {
    loadEpisode();
  }, [loadEpisode]);

  async function saveTitle() {
    if (!title.trim() || title === episode?.title) return;
    await fetch(`/api/episodes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
  }

  async function removeIdea(ideaId: string) {
    await fetch(`/api/ideas/${ideaId}/assign`, { method: "DELETE" });
    loadEpisode();
  }

  async function moveIdea(index: number, direction: "up" | "down") {
    if (!episode) return;
    const ideas = [...episode.ideas];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ideas.length) return;

    [ideas[index], ideas[newIndex]] = [ideas[newIndex], ideas[index]];

    await fetch(`/api/episodes/${id}/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaIds: ideas.map((i) => i.id) }),
    });
    loadEpisode();
  }

  async function deleteEpisode() {
    await fetch(`/api/episodes/${id}`, { method: "DELETE" });
    router.push("/episodes");
  }

  if (!episode) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-silver-mist/50">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Episode"
        back
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors"
            >
              {showNotes ? "Ideas" : "Notes"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 border border-slate-gray text-accent-red hover:border-accent-red text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        }
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-gray border border-silver-mist/20 p-4 w-full max-w-sm">
            <p className="text-white mb-2">Delete this episode?</p>
            <p className="text-silver-mist/60 text-sm mb-4">Ideas will be moved back to the ideas list.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-silver-mist text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteEpisode}
                className="px-3 py-1 border border-accent-red text-accent-red hover:bg-accent-red hover:text-white text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="w-full text-xl font-semibold text-white bg-transparent outline-none border-b border-transparent focus:border-marker-blue pb-1 mb-4"
        />

        {showNotes ? (
          /* Combined Notes View */
          <div className="space-y-6">
            {episode.ideas.length === 0 && (
              <p className="text-silver-mist/50 text-center py-8">No ideas in this episode yet.</p>
            )}
            {episode.ideas.map((idea) => (
              <div key={idea.id} className="border-l-2 border-marker-blue pl-3">
                <h3 className="text-white font-medium mb-1">{idea.title}</h3>
                {idea.notes && (
                  <p className="text-silver-mist text-sm whitespace-pre-line">{idea.notes}</p>
                )}
                {idea.links.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {idea.links.map((link) => (
                      <div key={link.id} className="text-xs">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-marker-blue hover:underline"
                        >
                          {link.title || link.url}
                        </a>
                        {link.summary && (
                          <p className="text-silver-mist/60 mt-1">{link.summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Ideas List View */
          <div className="space-y-2">
            {episode.ideas.length === 0 && (
              <p className="text-silver-mist/50 text-center py-8">
                No ideas yet. Assign ideas from the ideas page.
              </p>
            )}
            {episode.ideas.map((idea, index) => (
              <div
                key={idea.id}
                className="border border-slate-gray p-3 flex items-center gap-3"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveIdea(index, "up")}
                    disabled={index === 0}
                    className="text-silver-mist/40 hover:text-white text-xs disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveIdea(index, "down")}
                    disabled={index === episode.ideas.length - 1}
                    className="text-silver-mist/40 hover:text-white text-xs disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>
                <Link
                  href={`/ideas/${idea.id}`}
                  className="flex-1 min-w-0"
                >
                  <h3 className="text-white text-sm font-medium truncate">{idea.title}</h3>
                  <span className="text-xs text-silver-mist/60">
                    {idea.links.length} links · score {idea.voteScore}
                  </span>
                </Link>
                <button
                  onClick={() => removeIdea(idea.id)}
                  className="text-silver-mist/40 hover:text-accent-red text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
