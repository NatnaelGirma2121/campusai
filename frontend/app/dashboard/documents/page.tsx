"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, CampusDocument, Course, Department } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

type UploadMode = "text" | "file";

export default function DocumentsPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [documents, setDocuments] = useState<CampusDocument[]>([]);

  const [uploadMode, setUploadMode] = useState<UploadMode>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    api.departments(token).then(setDepartments);
    refreshDocuments();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.courses(token, departmentId || undefined).then(setCourses);
  }, [token, departmentId]);

  function refreshDocuments() {
    if (!token) return;
    api.documents(token).then(setDocuments);
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const doc =
        uploadMode === "text"
          ? await api.uploadDocument(token, {
              title,
              content,
              department_id: departmentId || undefined,
              course_id: courseId || undefined,
            })
          : await (async () => {
              if (!file) throw new ApiError(400, "Choose a PDF or PPTX file first.");
              return api.uploadDocumentFile(token, {
                title,
                department_id: departmentId || undefined,
                course_id: courseId || undefined,
                file,
              });
            })();

      setMessage({ text: `Uploaded "${doc.title}" — ${doc.chunk_count} chunk(s) indexed.` });
      resetForm();
      refreshDocuments();
    } catch (err) {
      setMessage({
        text: err instanceof ApiError ? err.message : "Upload failed. Try again.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const deptName = (id: string | null) => (id ? departments.find((d) => d.id === id)?.name : null);
  const courseCode = (id: string | null) => (id ? courses.find((c) => c.id === id)?.code : null);

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Documents</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Feed CampusAI's knowledge base
      </h1>
      <p className="text-muted text-sm mt-1">
        Uploaded content is chunked and embedded — students can then ask CampusAI questions
        grounded in it from the Chat page, or generate study tools from it.
      </p>

      <TraceDivider className="my-6" />

      <div className="flex gap-1.5 mb-4">
        {(["text", "file"] as UploadMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setUploadMode(mode);
              setMessage(null);
            }}
            className={`text-xs rounded px-3 py-1.5 border transition-colors ${
              uploadMode === mode
                ? "bg-copper text-bg border-copper font-medium"
                : "border-border text-muted hover:text-text hover:bg-surfaceRaised"
            }`}
          >
            {mode === "text" ? "Paste text" : "Upload PDF / PPTX"}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-lg p-4 space-y-3 max-w-2xl"
      >
        {message && (
          <p className={`text-sm ${message.error ? "text-danger" : "text-success"}`}>
            {message.text}
          </p>
        )}

        <div>
          <label className="block text-xs text-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. ECE Department Handbook"
            className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1.5">
              Department <span className="text-muted/60">(optional — leave unset for university-wide)</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
            >
              <option value="">University-wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1.5">Course (optional)</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={courses.length === 0}
              className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 disabled:opacity-40"
            >
              <option value="">Any course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {uploadMode === "text" ? (
          <div>
            <label className="block text-xs text-muted mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              placeholder="Paste the handbook, syllabus, or policy text here…"
              className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 font-mono"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs text-muted mb-1.5">File (PDF or PPTX, max 15 MB)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-copper file:text-bg file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium text-sm rounded px-4 py-2"
        >
          {submitting ? "Uploading…" : "Upload"}
        </button>
      </form>

      <h2 className="font-display text-lg text-text mt-8 mb-3">Existing documents</h2>
      <div className="border border-border rounded-lg overflow-hidden max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-muted text-xs uppercase tracking-wide text-left">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Scope</th>
              <th className="px-4 py-2.5 font-medium text-right">Chunks</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-2.5 text-text">{d.title}</td>
                <td className="px-4 py-2.5 text-muted">
                  {courseCode(d.course_id) || deptName(d.department_id) || "University-wide"}
                </td>
                <td className="px-4 py-2.5 text-muted font-mono text-right">{d.chunk_count}</td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
