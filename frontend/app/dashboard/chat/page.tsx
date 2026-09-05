"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, ChatSource, Course, Department } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
}

export default function ChatPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!token) return;
    api.departments(token).then(setDepartments);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.courses(token, departmentId || undefined).then(setCourses);
    setCourseId("");
  }, [token, departmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (!token) return;
        setTranscribing(true);
        try {
          const { text } = await api.transcribeAudio(token, blob);
          setQuestion((prev) => (prev ? `${prev} ${text}` : text));
        } catch (err) {
          setVoiceError(err instanceof ApiError ? err.message : "Couldn't transcribe that.");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setVoiceError("Microphone access denied or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !question.trim() || sending) return;

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setSending(true);

    try {
      const scope: { course_id?: string; department_id?: string } = {};
      if (courseId) scope.course_id = courseId;
      else if (departmentId) scope.department_id = departmentId;

      const response = await api.chat(token, userMessage.content, scope);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer, sources: response.sources },
      ]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong reaching CampusAI. Try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: message, error: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div>
        <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Chat</p>
        <h1 className="font-display text-2xl font-medium text-text mt-2">Ask CampusAI</h1>
        <p className="text-muted text-sm mt-1">
          Answers are grounded only in documents your instructors or admins have uploaded.
        </p>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
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
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={courses.length === 0}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 disabled:opacity-40"
        >
          <option value="">Any course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
      </div>

      <TraceDivider className="my-4" />

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <p className="text-muted text-sm">
            Ask something like "What's the policy on retaking a failed course?" — narrow the
            scope above if you want it to search a specific department or course only.
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
            <p className={m.role === "user" ? "text-text" : "text-text"}>{m.content}</p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                <p className="text-xs text-muted uppercase tracking-wide">Sources</p>
                {m.sources.map((s, j) => (
                  <p key={j} className="font-mono text-xs text-copper">
                    {s.document_title}{" "}
                    <span className="text-muted">({(s.similarity * 100).toFixed(0)}% match)</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {voiceError && <p className="text-xs text-danger mt-2">{voiceError}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={transcribing ? "Transcribing…" : "Ask a question…"}
          disabled={transcribing}
          className="flex-1 bg-surfaceRaised border border-border rounded px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal disabled:opacity-50"
        />
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing}
          title={recording ? "Stop recording" : "Ask by voice"}
          className={`rounded px-3 py-2.5 text-sm font-medium transition-colors border ${
            recording
              ? "bg-danger/10 border-danger text-danger animate-pulse"
              : "border-border text-muted hover:text-text hover:bg-surfaceRaised"
          }`}
        >
          {recording ? "● Stop" : "🎤"}
        </button>
        <button
          type="submit"
          disabled={sending || !question.trim()}
          className="bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-ink font-medium text-sm rounded px-5 py-2.5"
        >
          {sending ? "Asking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
