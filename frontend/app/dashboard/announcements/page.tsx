"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  Announcement,
  AnnouncementCategory,
  ApiError,
  Department,
} from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

const CATEGORIES: AnnouncementCategory[] = [
  "emergency",
  "academic",
  "scholarships",
  "events",
  "sports",
];

const CATEGORY_STYLE: Record<AnnouncementCategory, string> = {
  emergency: "text-danger border-danger/40 bg-danger/10",
  academic: "text-signal border-signal/40 bg-signal/10",
  scholarships: "text-copper border-copper/40 bg-copper/10",
  events: "text-text border-border bg-surfaceRaised",
  sports: "text-success border-success/40 bg-success/10",
};

export default function AnnouncementsPage() {
  const { token, user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AnnouncementCategory | "">("");

  const canPost = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    if (!token) return;
    api.departments(token).then(setDepartments);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api
      .announcements(token, {
        departmentId: departmentFilter || undefined,
        category: categoryFilter || undefined,
      })
      .then(setAnnouncements);
  }, [token, departmentFilter, categoryFilter]);

  function refresh() {
    if (!token) return;
    api
      .announcements(token, {
        departmentId: departmentFilter || undefined,
        category: categoryFilter || undefined,
      })
      .then(setAnnouncements);
  }

  async function handleDelete(id: string) {
    if (!token) return;
    await api.deleteAnnouncement(token, id);
    refresh();
  }

  const deptName = (id: string | null) => (id ? departments.find((d) => d.id === id)?.name : null);

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Announcements</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">What's happening</h1>

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as AnnouncementCategory | "")}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text capitalize focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <TraceDivider className="my-6" />

      {canPost && <PostForm departments={departments} onPosted={refresh} />}

      <div className="space-y-3 mt-6">
        {announcements.map((a) => (
          <div key={a.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {a.is_pinned && <span className="text-copper text-xs">📌</span>}
                  <h2 className="font-display text-lg text-text">{a.title}</h2>
                </div>
                <p className="text-muted text-sm mt-1">{a.content}</p>
              </div>
              <span
                className={`shrink-0 text-xs capitalize border rounded px-2 py-1 ${CATEGORY_STYLE[a.category]}`}
              >
                {a.category}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="font-mono text-xs text-muted">
                {deptName(a.department_id) ?? "University-wide"} ·{" "}
                {new Date(a.created_at).toLocaleDateString()}
              </span>
              {canPost && (a.posted_by_id === user?.id || user?.role === "admin") && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-muted hover:text-danger transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-muted text-sm">No announcements match this filter.</p>
        )}
      </div>
    </div>
  );
}

function PostForm({
  departments,
  onPosted,
}: {
  departments: Department[];
  onPosted: () => void;
}) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("academic");
  const [departmentId, setDepartmentId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createAnnouncement(token, {
        title,
        content,
        category,
        department_id: departmentId || undefined,
        is_pinned: isPinned,
      });
      setMessage({ text: "Posted." });
      setTitle("");
      setContent("");
      setIsPinned(false);
      onPosted();
    } catch (err) {
      setMessage({
        text: err instanceof ApiError ? err.message : "Couldn't post. Try again.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-lg p-4 space-y-3 max-w-2xl"
    >
      <h2 className="font-display text-lg text-text">Post an announcement</h2>
      {message && (
        <p className={`text-xs ${message.error ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Title"
        className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={3}
        placeholder="Details…"
        className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text capitalize focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">University-wide</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          Pin to top
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="ml-auto bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium text-sm rounded px-4 py-2"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
