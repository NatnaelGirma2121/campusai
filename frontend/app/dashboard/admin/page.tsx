"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, Course, Department, UserRead } from "@/lib/api";
import { TraceDivider } from "@/components/TraceDivider";

export default function AdminPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<UserRead[]>([]);

  useEffect(() => {
    if (!token) return;
    refreshAll();
  }, [token]);

  function refreshAll() {
    if (!token) return;
    api.departments(token).then(setDepartments);
    api.courses(token).then(setCourses);
    api.users(token).then((users) => setTeachers(users.filter((u) => u.role === "teacher")));
  }

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-copper uppercase">Admin</p>
      <h1 className="font-display text-2xl font-medium text-text mt-2">
        Manage departments &amp; courses
      </h1>

      <TraceDivider className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentPanel
          token={token}
          departments={departments}
          onCreated={refreshAll}
        />
        <CoursePanel
          token={token}
          departments={departments}
          teachers={teachers}
          onCreated={refreshAll}
        />
      </div>

      <h2 className="font-display text-lg text-text mt-8 mb-3">All departments</h2>
      <SimpleTable
        rows={departments}
        columns={[
          { header: "Code", render: (d: Department) => d.code },
          { header: "Name", render: (d: Department) => d.name },
        ]}
        emptyText="No departments yet."
      />

      <h2 className="font-display text-lg text-text mt-8 mb-3">All courses</h2>
      <SimpleTable
        rows={courses}
        columns={[
          { header: "Code", render: (c: Course) => c.code },
          { header: "Title", render: (c: Course) => c.title },
          {
            header: "Department",
            render: (c: Course) => departments.find((d) => d.id === c.department_id)?.code ?? "—",
          },
          { header: "Credits", render: (c: Course) => String(c.credit_hours) },
        ]}
        emptyText="No courses yet."
      />
    </div>
  );
}

function DepartmentPanel({
  token,
  departments,
  onCreated,
}: {
  token: string | null;
  departments: Department[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createDepartment(token, { name, code });
      setMessage({ text: `Created "${name}".` });
      setName("");
      setCode("");
      onCreated();
    } catch (err) {
      setMessage({
        text: err instanceof ApiError ? err.message : "Couldn't create department.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-lg p-4 space-y-3"
    >
      <h2 className="font-display text-lg text-text">New department</h2>
      {message && (
        <p className={`text-xs ${message.error ? "text-danger" : "text-success"}`}>{message.text}</p>
      )}
      <Field label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Computer Science"
          className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        />
      </Field>
      <Field label="Code">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          placeholder="CS"
          className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:ring-2 focus:ring-signal/50"
        />
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium text-sm rounded px-4 py-2"
      >
        {submitting ? "Creating…" : "Create department"}
      </button>
    </form>
  );
}

function CoursePanel({
  token,
  departments,
  teachers,
  onCreated,
}: {
  token: string | null;
  departments: Department[];
  teachers: UserRead[];
  onCreated: () => void;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [creditHours, setCreditHours] = useState(3);
  const [departmentId, setDepartmentId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !departmentId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createCourse(token, {
        code,
        title,
        credit_hours: creditHours,
        department_id: departmentId,
        instructor_id: instructorId || undefined,
      });
      setMessage({ text: `Created "${code}".` });
      setCode("");
      setTitle("");
      onCreated();
    } catch (err) {
      setMessage({
        text: err instanceof ApiError ? err.message : "Couldn't create course.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-lg p-4 space-y-3"
    >
      <h2 className="font-display text-lg text-text">New course</h2>
      {message && (
        <p className={`text-xs ${message.error ? "text-danger" : "text-success"}`}>{message.text}</p>
      )}
      <div className="flex gap-3">
        <Field label="Code">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            placeholder="ECE-301"
            className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:ring-2 focus:ring-signal/50"
          />
        </Field>
        <Field label="Credit hours">
          <input
            type="number"
            min={1}
            max={12}
            value={creditHours}
            onChange={(e) => setCreditHours(Number(e.target.value))}
            required
            className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
          />
        </Field>
      </div>
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="VLSI Design"
          className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        />
      </Field>
      <Field label="Department">
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          required
          className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">Select…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Instructor (optional)">
        <select
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          className="w-full bg-surfaceRaised border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <option value="">Unassigned</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="bg-copper hover:bg-copperDim disabled:opacity-50 transition-colors text-bg font-medium text-sm rounded px-4 py-2"
      >
        {submitting ? "Creating…" : "Create course"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function SimpleTable<T>({
  rows,
  columns,
  emptyText,
}: {
  rows: T[];
  columns: { header: string; render: (row: T) => string }[];
  emptyText: string;
}) {
  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-muted text-xs uppercase tracking-wide text-left">
            {columns.map((c) => (
              <th key={c.header} className="px-4 py-2.5 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {columns.map((c) => (
                <td key={c.header} className="px-4 py-2.5 text-text">
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-muted">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
