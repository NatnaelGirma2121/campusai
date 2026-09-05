"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, Course, RosterEntry } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

const ATTENDANCE_STATUSES = ["present", "absent", "excused", "late"];
const GRADE_COMPONENTS = ["assignment", "quiz", "midterm", "final", "project", "participation"];

type FormKind = "attendance" | "grade";

export default function RosterPage() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<{ enrollmentId: string; kind: FormKind } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [rowMessage, setRowMessage] = useState<Record<string, { text: string; error?: boolean }>>(
    {}
  );

  useEffect(() => {
    if (!token || !user) return;
    const instructorId = user.role === "teacher" ? user.id : undefined;
    api.courses(token, undefined, instructorId).then(setCourses);
  }, [token, user]);

  useEffect(() => {
    if (!token || !courseId) {
      setRoster([]);
      return;
    }
    setLoadError(null);
    api
      .roster(token, courseId)
      .then(setRoster)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load roster."));
  }, [token, courseId]);

  async function submitAttendance(enrollmentId: string, form: HTMLFormElement) {
    if (!token) return;
    const data = new FormData(form);
    setSubmitting(true);
    try {
      await api.recordAttendance(token, {
        enrollment_id: enrollmentId,
        date: String(data.get("date")),
        status: String(data.get("status")),
        note: String(data.get("note") || "") || undefined,
      });
      setRowMessage((prev) => ({ ...prev, [enrollmentId]: { text: "Attendance recorded." } }));
      setActiveForm(null);
    } catch (err) {
      setRowMessage((prev) => ({
        ...prev,
        [enrollmentId]: {
          text: err instanceof ApiError ? err.message : "Couldn't record attendance.",
          error: true,
        },
      }));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGrade(enrollmentId: string, form: HTMLFormElement) {
    if (!token) return;
    const data = new FormData(form);
    setSubmitting(true);
    try {
      await api.recordGrade(token, {
        enrollment_id: enrollmentId,
        component: String(data.get("component")),
        label: String(data.get("label")),
        score: Number(data.get("score")),
        max_score: Number(data.get("max_score")),
      });
      setRowMessage((prev) => ({ ...prev, [enrollmentId]: { text: "Grade recorded." } }));
      setActiveForm(null);
    } catch (err) {
      setRowMessage((prev) => ({
        ...prev,
        [enrollmentId]: {
          text: err instanceof ApiError ? err.message : "Couldn't record grade.",
          error: true,
        },
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Roster</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Record attendance &amp; grades
      </h1>

      <div className="flex items-center gap-3 mt-6">
        <label className="text-sm text-muted" htmlFor="course-select">
          Course
        </label>
        <select
          id="course-select"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="bg-surfaceRaised border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">Select a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      <TraceDivider className="my-6" />

      {loadError && <p className="text-danger text-sm mb-4">{loadError}</p>}

      {!courseId && <p className="text-muted text-sm">Choose a course to see its roster.</p>}

      {courseId && roster.length === 0 && !loadError && (
        <p className="text-muted text-sm">No students enrolled in this course yet.</p>
      )}

      <div className="space-y-3">
        {roster.map((entry) => (
          <div key={entry.enrollment_id} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text text-sm font-medium">{entry.student_name}</p>
                <p className="text-muted text-xs font-mono">{entry.student_email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted">{entry.semester}</span>
                <button
                  onClick={() =>
                    setActiveForm(
                      activeForm?.enrollmentId === entry.enrollment_id && activeForm.kind === "attendance"
                        ? null
                        : { enrollmentId: entry.enrollment_id, kind: "attendance" }
                    )
                  }
                  className="text-xs border border-border rounded px-3 py-1.5 text-muted hover:text-text hover:bg-surfaceRaised transition-colors"
                >
                  Attendance
                </button>
                <button
                  onClick={() =>
                    setActiveForm(
                      activeForm?.enrollmentId === entry.enrollment_id && activeForm.kind === "grade"
                        ? null
                        : { enrollmentId: entry.enrollment_id, kind: "grade" }
                    )
                  }
                  className="text-xs border border-border rounded px-3 py-1.5 text-muted hover:text-text hover:bg-surfaceRaised transition-colors"
                >
                  Grade
                </button>
              </div>
            </div>

            {rowMessage[entry.enrollment_id] && (
              <p
                className={`text-xs mt-2 ${
                  rowMessage[entry.enrollment_id].error ? "text-danger" : "text-success"
                }`}
              >
                {rowMessage[entry.enrollment_id].text}
              </p>
            )}

            {activeForm?.enrollmentId === entry.enrollment_id && activeForm.kind === "attendance" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAttendance(entry.enrollment_id, e.currentTarget);
                }}
                className="flex flex-wrap items-end gap-2 mt-3 pt-3 border-t border-border"
              >
                <Field label="Date">
                  <input
                    name="date"
                    type="date"
                    required
                    className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text"
                  />
                </Field>
                <Field label="Status">
                  <select
                    name="status"
                    defaultValue="present"
                    className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text capitalize"
                  >
                    {ATTENDANCE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Note (optional)">
                  <input
                    name="note"
                    type="text"
                    className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text w-40"
                  />
                </Field>
                <SubmitButton submitting={submitting} />
              </form>
            )}

            {activeForm?.enrollmentId === entry.enrollment_id && activeForm.kind === "grade" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitGrade(entry.enrollment_id, e.currentTarget);
                }}
                className="flex flex-wrap items-end gap-2 mt-3 pt-3 border-t border-border"
              >
                <Field label="Component">
                  <select
                    name="component"
                    defaultValue="assignment"
                    className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text capitalize"
                  >
                    {GRADE_COMPONENTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Label">
                  <input
                    name="label"
                    type="text"
                    required
                    placeholder="Assignment 1"
                    className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text w-32"
                  />
                </Field>
                <Field label="Score">
                  <input
                    name="score"
                    type="number"
                    step="0.1"
                    required
                    className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text w-20"
                  />
                </Field>
                <Field label="Max score">
                  <input
                    name="max_score"
                    type="number"
                    step="0.1"
                    defaultValue={100}
                    required
                    className="bg-surfaceRaised border border-border rounded px-2 py-1.5 text-xs text-text w-20"
                  />
                </Field>
                <SubmitButton submitting={submitting} />
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-muted uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

function SubmitButton({ submitting }: { submitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-ink font-medium text-xs rounded px-4 py-2"
    >
      {submitting ? "Saving…" : "Save"}
    </button>
  );
}
