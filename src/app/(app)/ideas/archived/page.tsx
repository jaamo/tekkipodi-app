"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

interface ArchivedIdea {
  id: string;
  title: string;
  voteScore: number;
  archivedAt: string;
}

export default function ArchivedIdeasPage() {
  const [ideas, setIdeas] = useState<ArchivedIdea[]>([]);

  const loadIdeas = useCallback(async () => {
    const res = await fetch("/api/ideas/archived");
    if (res.ok) setIdeas(await res.json());
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  async function unarchive(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/ideas/${id}/archive`, { method: "DELETE" });
    loadIdeas();
  }

  return (
    <div>
      <PageHeader title="Archived Ideas" back />

      <div className="px-4 space-y-2">
        {ideas.length === 0 && (
          <p className="text-silver-mist/50 text-center py-8">
            No archived ideas.
          </p>
        )}
        {ideas.map((idea) => (
          <Link
            key={idea.id}
            href={`/ideas/${idea.id}`}
            className="block border border-slate-gray p-3 transition-colors hover:border-silver-mist/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{idea.title}</h3>
              </div>
              <button
                onClick={(e) => unarchive(idea.id, e)}
                className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors shrink-0"
              >
                Unarchive
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
