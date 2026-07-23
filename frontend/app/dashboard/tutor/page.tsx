"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, ChatSource, Course, TutorMessage } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

interface DisplayMessage extends TutorMessage {
  sources?: ChatSource[];
  error?: boolean;
}

export default function TutorPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    api.myEnrollments(token).then(async (enrolls) => {
      const allCourses = await api.courses(token);
      const enrolledCourseIds = new Set(enrolls.map((e) => e.course_id));
      setCourses(allCourses.filter((c) => enrolledCourseIds.has(c.id)));
    });
  }, [token]);

  useEffect(() => {
    setMessages([]);
  }, [courseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !courseId || !question.trim() || sending) return;

    const userMessage: DisplayMessage = { role: "user", content: question };
    const history: TutorMessage[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setSending(true);

    try {
      const response = await api.askTutor(token, courseId, userMessage.content, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer, sources: response.sources },
      ]);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: message, error: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div>
        <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Tutor</p>
        <h1 className="font-display text-2xl font-medium text-text mt-2">Your course tutor</h1>
        <p className="text-muted text-sm mt-1">
          Explains step by step, remembers this conversation, and draws on course documents when
          they're relevant.
        </p>
      </div>

      <div className="mt-4">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 min-w-[16rem]"
        >
          <option value="">Select an enrolled course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      <TraceDivider className="my-4" />

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {!courseId && <p className="text-muted text-sm">Pick a course to start a tutoring session.</p>}
        {courseId && messages.length === 0 && (
          <p className="text-muted text-sm">
            Ask anything about this course — a concept you're stuck on, a problem you want walked
            through, or a request for practice.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-2xl rounded-lg px-4 py-3 text-sm ${
              m.role === "user"
                ? "bg-surfaceRaised border border-border ml-auto"
                : m.error
                  ? "bg-danger/10 border border-danger/30 text-danger"
                  : "bg-surface border border-border"
            }`}
          >
            <p className="text-text whitespace-pre-wrap">{m.content}</p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                <p className="text-xs text-muted uppercase tracking-wide">From course materials</p>
                {m.sources.map((s, j) => (
                  <p key={j} className="font-mono text-xs text-copper">
                    {s.document_title}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!courseId}
          placeholder={courseId ? "Ask your tutor…" : "Select a course first"}
          className="flex-1 bg-surfaceRaised border border-border rounded px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !question.trim() || !courseId}
          className="bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium text-sm rounded px-5 py-2.5"
        >
          {sending ? "Thinking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
