"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import ReactMarkdown from "react-markdown";

interface LinkData {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  crawlStatus: string;
}

interface Episode {
  id: string;
  title: string;
}

interface IdeaData {
  id: string;
  title: string;
  notes: string;
  voteScore: number;
  viewCount: number;
  archivedAt: string | null;
  episodeId: string | null;
  links: LinkData[];
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [collapsedLinks, setCollapsedLinks] = useState<Set<string>>(new Set());

  function toggleLink(linkId: string) {
    setCollapsedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  }

  const loadIdea = useCallback(async () => {
    const res = await fetch(`/api/ideas/${id}`);
    if (res.ok) {
      const data = await res.json();
      setIdea(data);
      setTitle(data.title);
      setNotes(data.notes);
    }
  }, [id]);

  useEffect(() => {
    loadIdea();
  }, [loadIdea]);

  // Poll for pending links
  useEffect(() => {
    if (!idea?.links.some((l) => l.crawlStatus === "pending" || l.crawlStatus === "crawling")) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/ideas/${id}`);
      if (res.ok) {
        const data = await res.json();
        setIdea(data);
        if (!data.links.some((l: LinkData) => l.crawlStatus === "pending" || l.crawlStatus === "crawling")) {
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [idea?.links, id]);

  async function saveNotes() {
    setSaving(true);
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, notes }),
    });
    setSaving(false);
    if (res.ok) {
      setIdea((prev) => (prev ? { ...prev, title, notes } : prev));
      setJustSaved(true);
    }
  }

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2000);
    return () => clearTimeout(t);
  }, [justSaved]);

  const notesDirty = idea !== null && notes !== idea.notes;

  async function submitLink(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;

    await fetch(`/api/ideas/${id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: trimmed }),
    });

    setNewUrl("");
    loadIdea();
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    submitLink(newUrl);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted) return;
    try {
      const parsed = new URL(pasted);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
      e.preventDefault();
      submitLink(pasted);
    } catch {
      // not a valid URL — fall through to default paste behavior
    }
  }

  async function deleteLink(linkId: string) {
    await fetch(`/api/ideas/${id}/links/${linkId}`, { method: "DELETE" });
    loadIdea();
  }

  async function moveLink(index: number, direction: "up" | "down") {
    if (!idea) return;
    const links = [...idea.links];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    [links[index], links[newIndex]] = [links[newIndex], links[index]];
    setIdea({ ...idea, links });

    await fetch(`/api/ideas/${id}/links/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkIds: links.map((l) => l.id) }),
    });
  }

  async function vote(direction: "up" | "down") {
    const res = await fetch(`/api/ideas/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (res.ok) {
      const data = await res.json();
      setIdea((prev) => (prev ? { ...prev, voteScore: data.voteScore } : null));
    }
  }

  async function deleteIdea() {
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    router.push("/ideas");
  }

  async function assignToEpisode(episodeId: string) {
    await fetch(`/api/ideas/${id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId }),
    });
    router.push("/ideas");
  }

  async function unassign() {
    await fetch(`/api/ideas/${id}/assign`, { method: "DELETE" });
    loadIdea();
  }

  async function loadEpisodes() {
    const res = await fetch("/api/episodes");
    if (res.ok) setEpisodes(await res.json());
    setShowAssign(true);
  }

  async function archiveIdea() {
    await fetch(`/api/ideas/${id}/archive`, { method: "POST" });
    router.push("/ideas");
  }

  async function polishNotes() {
    setPolishing(true);
    const res = await fetch(`/api/ideas/${id}/polish`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
      setIdea((prev) => (prev ? { ...prev, notes: data.notes } : null));
    }
    setPolishing(false);
  }

  if (!idea) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-silver-mist/50">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Idea"
        back
        action={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-silver-mist/60 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {idea?.viewCount ?? 0}
            </span>
            <Link
              href={`/ideas/${id}/chat`}
              className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors"
            >
              Think
            </Link>
            {!idea?.archivedAt && (
              <button
                onClick={archiveIdea}
                className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors"
              >
                Archive
              </button>
            )}
            {idea?.archivedAt && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 border border-slate-gray text-accent-red hover:border-accent-red text-sm transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        }
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-gray border border-silver-mist/20 p-4 w-full max-w-sm">
            <p className="text-white mb-4">Delete this idea?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 border border-slate-gray text-silver-mist hover:border-silver-mist text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteIdea}
                className="px-3 py-1 border border-accent-red text-accent-red hover:bg-accent-red hover:text-white text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveNotes}
          className="w-full text-xl font-semibold text-white bg-transparent outline-none border-b border-transparent focus:border-marker-blue pb-1"
        />
      </div>

      <div className="px-4 space-y-6">
        {/* Notes */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs text-silver-mist/60 uppercase tracking-wide">Notes</label>
              {saving ? (
                <span className="text-xs text-silver-mist/40">Saving...</span>
              ) : notesDirty ? (
                <span className="text-xs text-accent-red/70">Unsaved changes</span>
              ) : justSaved ? (
                <span className="text-xs text-marker-blue/70">Saved</span>
              ) : null}
            </div>
            <button
              onClick={polishNotes}
              disabled={polishing || !notes.trim()}
              className="px-2 py-0.5 border border-slate-gray text-silver-mist/60 hover:border-marker-blue hover:text-marker-blue text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {polishing ? "Polishing..." : "Polish"}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={6}
            className="w-full mt-1 px-3 py-2 bg-transparent border border-slate-gray text-silver-mist placeholder:text-silver-mist/50 outline-none focus:border-marker-blue resize-y"
            placeholder="Add notes..."
          />
        </div>

        {/* Vote */}
        <div className="flex w-full">
          <button
            onClick={() => vote("up")}
            className="flex-1 py-2 border border-slate-gray text-silver-mist hover:border-marker-blue hover:text-marker-blue transition-colors text-sm"
          >
            ▲ Up
          </button>
          <div className="flex items-center justify-center px-4 border-y border-slate-gray text-white font-medium min-w-[48px]">
            {idea.voteScore}
          </div>
          <button
            onClick={() => vote("down")}
            className="flex-1 py-2 border border-slate-gray text-silver-mist hover:border-accent-red hover:text-accent-red transition-colors text-sm"
          >
            ▼ Down
          </button>
        </div>

        {/* Links */}
        <div>
          <label className="text-xs text-silver-mist/60 uppercase tracking-wide">Links</label>
          <form onSubmit={addLink} className="flex gap-2 mt-1">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onPaste={handlePaste}
              placeholder="https://..."
              className="flex-1 px-3 py-2 bg-transparent border border-slate-gray text-silver-mist placeholder:text-silver-mist/50 outline-none focus:border-marker-blue"
            />
            <button
              type="submit"
              className="px-3 py-2 border border-slate-gray text-silver-mist hover:border-marker-blue transition-colors"
            >
              Add
            </button>
          </form>

          <div className="mt-2 space-y-2">
            {idea.links.map((link, index) => {
              const collapsed = collapsedLinks.has(link.id);
              return (
                <div key={link.id} className="border border-slate-gray p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => toggleLink(link.id)}
                      className="text-silver-mist/60 hover:text-silver-mist text-lg leading-none shrink-0 w-6 text-center"
                      aria-label={collapsed ? "Expand" : "Collapse"}
                    >
                      {collapsed ? "▸" : "▾"}
                    </button>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-marker-blue text-sm hover:underline truncate flex-1"
                    >
                      {link.title || link.url}
                    </a>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveLink(index, "up")}
                        disabled={index === 0}
                        className="text-silver-mist/60 hover:text-white text-base leading-none disabled:opacity-20"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveLink(index, "down")}
                        disabled={index === idea.links.length - 1}
                        className="text-silver-mist/60 hover:text-white text-base leading-none disabled:opacity-20"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="text-silver-mist/60 hover:text-accent-red text-lg leading-none shrink-0 px-1"
                      aria-label="Delete link"
                    >
                      ✕
                    </button>
                  </div>
                  {!collapsed && (
                    <>
                      {link.crawlStatus === "done" && link.summary && (
                        <div className="text-xs text-silver-mist/70 mt-2 prose prose-invert prose-xs max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_p]:my-1 [&_strong]:text-silver-mist">
                          <ReactMarkdown>{link.summary}</ReactMarkdown>
                        </div>
                      )}
                      {(link.crawlStatus === "pending" || link.crawlStatus === "crawling") && (
                        <p className="text-xs text-silver-mist/40 mt-2 animate-pulse">
                          Summarizing...
                        </p>
                      )}
                      {link.crawlStatus === "failed" && (
                        <p className="text-xs text-accent-red/70 mt-2">
                          Failed to crawl
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Assign to Episode */}
        <div>
          {idea.episodeId ? (
            <button
              onClick={unassign}
              className="w-full px-3 py-2 border border-slate-gray text-silver-mist hover:border-accent-red text-sm transition-colors"
            >
              Remove from episode
            </button>
          ) : (
            <>
              <button
                onClick={loadEpisodes}
                className="w-full px-3 py-2 border border-slate-gray text-silver-mist hover:border-marker-blue text-sm transition-colors"
              >
                Add to episode
              </button>
              {showAssign && (
                <div className="mt-2 space-y-1">
                  {episodes.length === 0 && (
                    <p className="text-xs text-silver-mist/50">No episodes yet. Create one first.</p>
                  )}
                  {episodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => assignToEpisode(ep.id)}
                      className="w-full px-3 py-2 border border-slate-gray text-left text-silver-mist hover:border-marker-blue text-sm transition-colors"
                    >
                      {ep.title}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
